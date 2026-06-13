#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { transform } from "esbuild";
import ts from "typescript";

const rootDir = process.cwd();
const configPath = path.join(rootDir, "i18n-locale-rules.json");
const command = process.argv[2] || "all";
const supportedCommands = new Set(["all", "keys", "resources", "hardcoded", "runtime"]);

if (!supportedCommands.has(command)) {
  console.error(`Unknown i18n locale integrity command: ${command}`);
  console.error("Supported commands: all, keys, resources, hardcoded, runtime");
  process.exit(1);
}

const toPosix = (value) => value.replace(/\\/g, "/");
const fromRoot = (relativePath) => path.join(rootDir, relativePath);
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();
const hasChinese = (value) => /[\u3400-\u9fff]/u.test(value);
const hasAsciiLetter = (value) => /[A-Za-z]/.test(value);
const testRegex = (pattern, value) => {
  pattern.lastIndex = 0;
  return pattern.test(value);
};

const readJson = (filePath) => JSON.parse(readFileSync(filePath, "utf8"));

const config = readJson(configPath);
const configuredIssueLimit = Number(process.env.I18N_ISSUE_LIMIT || config.issueLimit);
const issueLimit = Number.isFinite(configuredIssueLimit) && configuredIssueLimit > 0 ? configuredIssueLimit : 300;
const localeScopedResourceFileEntries = Object.entries(config.localeScopedResourceFiles || {}).flatMap(([locale, files]) =>
  (files || []).map((file) => ({ locale, file: toPosix(file) })),
);
const localeScopedResourceFileSet = new Set(localeScopedResourceFileEntries.map((entry) => entry.file));

const createRegexList = (patterns = []) =>
  patterns.map((pattern) => {
    try {
      return new RegExp(pattern, "giu");
    } catch (error) {
      throw new Error(`Invalid regex in i18n-locale-rules.json: ${pattern}\n${error.message}`);
    }
  });

const globalAllowPatterns = createRegexList(config.allowlist?.globalPatterns || []);
const localeAllowPatterns = Object.fromEntries(
  Object.entries(config.locales || {}).map(([locale]) => [
    locale,
    [
      ...createRegexList(config.allowlist?.[locale]?.allowedPatterns || []),
      ...(config.allowlist?.[locale]?.allowedPhrases || []).map((phrase) => new RegExp(escapeRegExp(phrase), "giu")),
    ],
  ]),
);

const hardcodedIgnoredTextPatterns = createRegexList(config.hardcoded?.ignoredTextPatterns || []);
const hardcodedExcludePathPatterns = createRegexList(config.hardcoded?.excludePathPatterns || []);
const hardcodedJsxAttributes = new Set(config.hardcoded?.jsxAttributes || []);
const hardcodedObjectPropertyNames = new Set(config.hardcoded?.objectPropertyNames || []);
const hardcodedMessageCallNames = new Set(config.hardcoded?.messageCallNames || []);

const issueKey = (issue) =>
  [
    issue.type,
    issue.locale,
    issue.file,
    issue.line,
    issue.url,
    issue.selector,
    issue.text,
    issue.reason,
  ].join("\u0000");

const dedupeIssues = (issues) => {
  const seen = new Set();
  const result = [];
  for (const issue of issues) {
    const key = issueKey(issue);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(issue);
  }
  return result;
};

const limitIssues = (issues) => {
  if (issues.length <= issueLimit) return issues;
  return [
    ...issues.slice(0, issueLimit),
    {
      type: "Issue limit",
      locale: "N/A",
      file: "N/A",
      line: "N/A",
      url: "N/A",
      selector: "N/A",
      text: `${issues.length - issueLimit} additional issue(s) omitted from output.`,
      reason: `The checker found more than ${issueLimit} issues.`,
      suggestedFix: "Fix the listed issues first, then rerun the command to reveal the remaining violations.",
    },
  ];
};

const printIssues = (issues) => {
  for (const issue of limitIssues(dedupeIssues(issues))) {
    console.error(`Type: ${issue.type || "N/A"}`);
    console.error(`Locale: ${issue.locale || "N/A"}`);
    console.error(`File: ${issue.file || "N/A"}`);
    console.error(`Line: ${issue.line || "N/A"}`);
    console.error(`URL: ${issue.url || "N/A"}`);
    console.error(`Selector: ${issue.selector || "N/A"}`);
    console.error(`Text: ${issue.text || "N/A"}`);
    console.error(`Reason: ${issue.reason || "N/A"}`);
    console.error(`Suggested fix: ${issue.suggestedFix || "N/A"}`);
    console.error("");
  }
};

const stripAllowedText = (text, locale) => {
  let result = String(text || "");
  for (const pattern of globalAllowPatterns) result = result.replace(pattern, " ");
  for (const pattern of localeAllowPatterns[locale] || []) result = result.replace(pattern, " ");
  return result.replace(/\s+/g, " ").trim();
};

const isFullyAllowlisted = (text, locale) => {
  const stripped = stripAllowedText(text, locale).replace(/[\s.,:;!?&/()[\]{}'"’‘“”\-+0-9]/g, "");
  return stripped.length === 0;
};

const findEnglishLeak = (text, locale = "zh-CN") => {
  const stripped = stripAllowedText(text, locale);
  const minWords = config.resourcePurity?.zhMinEnglishWords || 3;
  const minChars = config.resourcePurity?.zhMinEnglishChars || 18;
  const candidates = stripped.match(/[A-Za-z][A-Za-z0-9&'’.,()/\-\s]{8,}/g) || [];

  for (const rawCandidate of candidates) {
    const candidate = normalizeText(rawCandidate);
    const words = candidate.match(/[A-Za-z]{2,}/g) || [];
    if (words.length >= minWords && candidate.replace(/[^A-Za-z]/g, "").length >= minChars) {
      return candidate;
    }
  }

  return "";
};

const findChineseLeak = (text, locale = "en-US") => {
  const stripped = stripAllowedText(text, locale);
  const match = stripped.match(/[\u3400-\u9fff]+/u);
  return match?.[0] || "";
};

const locateLine = (source, searchText) => {
  if (!searchText) return "N/A";
  const index = source.indexOf(searchText);
  if (index < 0) return "N/A";
  return source.slice(0, index).split(/\r?\n/).length;
};

const nodeLine = (sourceFile, node) => {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return position.line + 1;
};

const propertyNameText = (nameNode) => {
  if (!nameNode) return "";
  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) return String(nameNode.text);
  return nameNode.getText().replace(/^["']|["']$/g, "");
};

const scopedPropertyLocale = (propertyName) => {
  if (/Zh$|_zh$/u.test(propertyName)) return "zh-CN";
  if (/En$|_en$/u.test(propertyName)) return "en-US";
  return null;
};

const readStaticString = (node) => {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isJsxText(node)) return node.getText();
  return null;
};

const collectResourceLeafPaths = (node, prefix = []) => {
  if (!node) return [];
  const staticValue = readStaticString(node);
  if (staticValue !== null) return [prefix.join(".") || "$"];

  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.flatMap((property) => {
      if (!ts.isPropertyAssignment(property)) return [];
      return collectResourceLeafPaths(property.initializer, [...prefix, propertyNameText(property.name)]);
    });
  }

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.flatMap((element, index) => collectResourceLeafPaths(element, [...prefix, `[${index}]`]));
  }

  return [];
};

const findObjectProperty = (objectNode, propertyName) => {
  if (!ts.isObjectLiteralExpression(objectNode)) return null;
  return objectNode.properties.find(
    (property) => ts.isPropertyAssignment(property) && propertyNameText(property.name) === propertyName,
  ) || null;
};

const parseSourceFile = (filePath, source) => {
  const extension = path.extname(filePath).toLowerCase();
  const kind =
    extension === ".tsx" ? ts.ScriptKind.TSX :
    extension === ".jsx" ? ts.ScriptKind.JSX :
    extension === ".js" ? ts.ScriptKind.JS :
    ts.ScriptKind.TS;
  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, kind);
};

const importTsExport = async (relativeFilePath, exportName) => {
  const absolutePath = fromRoot(relativeFilePath);
  const source = readFileSync(absolutePath, "utf8");
  const transformed = await transform(source, {
    loader: path.extname(relativeFilePath).toLowerCase() === ".tsx" ? "tsx" : "ts",
    format: "esm",
    platform: "neutral",
    sourcemap: false,
  });

  const tempDir = mkdtempSync(path.join(tmpdir(), "flashcast-i18n-"));
  const tempFile = path.join(tempDir, "resource.mjs");
  writeFileSync(tempFile, transformed.code, "utf8");

  try {
    const module = await import(pathToFileURL(tempFile).href);
    return module[exportName];
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
};

const checkTranslationKeys = async () => {
  const issues = [];
  const resource = config.translationKeyResource;
  const translations = await importTsExport(resource.path, resource.exportName);
  const source = readFileSync(fromRoot(resource.path), "utf8");
  const localeEntries = Object.entries(config.locales);

  for (const [key, entry] of Object.entries(translations || {})) {
    for (const [locale, propertyName] of localeEntries) {
      if (!entry || !Object.prototype.hasOwnProperty.call(entry, propertyName)) {
        issues.push({
          type: "Translation key parity",
          locale,
          file: resource.path,
          line: locateLine(source, `"${key}"`),
          url: "N/A",
          selector: "N/A",
          text: key,
          reason: `Translation key is missing locale property "${propertyName}".`,
          suggestedFix: `Add a ${propertyName} value for "${key}" in ${resource.path}.`,
        });
        continue;
      }

      if (typeof entry[propertyName] !== "string" || !entry[propertyName].trim()) {
        issues.push({
          type: "Missing translation",
          locale,
          file: resource.path,
          line: locateLine(source, `"${key}"`),
          url: "N/A",
          selector: "N/A",
          text: key,
          reason: `Translation value for locale property "${propertyName}" is empty or not a string.`,
          suggestedFix: `Fill "${key}.${propertyName}" with the approved ${locale} copy.`,
        });
      }
    }
  }

  const localePropertyToLocale = Object.fromEntries(Object.entries(config.locales).map(([locale, property]) => [property, locale]));
  const localeProperties = Object.values(config.locales);

  for (const relativeFilePath of config.localeResourceFiles || []) {
    const absolutePath = fromRoot(relativeFilePath);
    if (!existsSync(absolutePath)) continue;

    const resourceSource = readFileSync(absolutePath, "utf8");
    const sourceFile = parseSourceFile(relativeFilePath, resourceSource);

    const visit = (node) => {
      if (ts.isObjectLiteralExpression(node)) {
        const presentLocaleProperties = localeProperties
          .map((propertyName) => [propertyName, findObjectProperty(node, propertyName)])
          .filter(([, property]) => Boolean(property));

        if (presentLocaleProperties.length > 0) {
          for (const propertyName of localeProperties) {
            if (!findObjectProperty(node, propertyName)) {
              issues.push({
                type: "Translation key parity",
                locale: localePropertyToLocale[propertyName],
                file: relativeFilePath,
                line: nodeLine(sourceFile, node),
                url: "N/A",
                selector: "N/A",
                text: propertyName,
                reason: `Structured i18n resource is missing locale object "${propertyName}".`,
                suggestedFix: `Add a matching "${propertyName}" object with the same translation paths in ${relativeFilePath}.`,
              });
            }
          }

          if (presentLocaleProperties.length === localeProperties.length) {
            const pathSets = Object.fromEntries(
              presentLocaleProperties.map(([propertyName, property]) => [
                propertyName,
                new Set(collectResourceLeafPaths(property.initializer)),
              ]),
            );
            const allPaths = new Set(Object.values(pathSets).flatMap((pathSet) => [...pathSet]));

            for (const propertyName of localeProperties) {
              for (const leafPath of allPaths) {
                if (!pathSets[propertyName].has(leafPath)) {
                  issues.push({
                    type: "Translation key parity",
                    locale: localePropertyToLocale[propertyName],
                    file: relativeFilePath,
                    line: nodeLine(sourceFile, findObjectProperty(node, propertyName)?.initializer || node),
                    url: "N/A",
                    selector: "N/A",
                    text: leafPath,
                    reason: `Structured i18n resource is missing translation path "${leafPath}" for "${propertyName}".`,
                    suggestedFix: `Add "${leafPath}" to the "${propertyName}" branch in ${relativeFilePath}.`,
                  });
                }
              }
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  return issues;
};

const scanLocaleResourceValue = ({ issues, locale, file, line, text }) => {
  const normalized = normalizeText(text);
  if (!normalized || isFullyAllowlisted(normalized, locale)) return;

  if (locale === "en-US") {
    const leak = findChineseLeak(normalized, locale);
    if (leak) {
      issues.push({
        type: "Locale resource purity",
        locale,
        file,
        line,
        url: "N/A",
        selector: "N/A",
        text: normalized,
        reason: "en-US translation resource contains Chinese characters.",
        suggestedFix: "Move the Chinese text to zh-CN or add a narrowly scoped allowlist entry only if this is an approved proper noun.",
      });
    }
    return;
  }

  if (locale === "zh-CN") {
    const leak = findEnglishLeak(normalized, locale);
    if (leak) {
      issues.push({
        type: "Locale resource purity",
        locale,
        file,
        line,
        url: "N/A",
        selector: "N/A",
        text: normalized,
        reason: `zh-CN translation resource contains an unauthorized English phrase: "${leak}".`,
        suggestedFix: "Translate this phrase into Chinese, or add it to the allowlist only if it is a brand name, technical term, URL, email, version, or code fragment.",
      });
    }
  }
};

const checkResourcePurity = () => {
  const issues = [];
  const localePropertyToLocale = Object.fromEntries(Object.entries(config.locales).map(([locale, property]) => [property, locale]));

  for (const relativeFilePath of config.localeResourceFiles || []) {
    const absolutePath = fromRoot(relativeFilePath);
    if (!existsSync(absolutePath)) continue;

    const source = readFileSync(absolutePath, "utf8");
    const sourceFile = parseSourceFile(relativeFilePath, source);

    const scanStringDescendants = (node, locale) => {
      if (!node) return;
      if (ts.isPropertyAssignment(node)) {
        scanStringDescendants(node.initializer, locale);
        return;
      }

      const staticValue = readStaticString(node);
      if (staticValue !== null) {
        scanLocaleResourceValue({
          issues,
          locale,
          file: relativeFilePath,
          line: nodeLine(sourceFile, node),
          text: staticValue,
        });
        return;
      }
      ts.forEachChild(node, (child) => scanStringDescendants(child, locale));
    };

    const visit = (node) => {
      if (ts.isPropertyAssignment(node)) {
        const propertyName = propertyNameText(node.name);
        const locale = localePropertyToLocale[propertyName];
        if (locale) {
          scanStringDescendants(node.initializer, locale);
          return;
        }
      }

      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && /zh/i.test(node.name.text)) {
        scanStringDescendants(node.initializer, "zh-CN");
        return;
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  for (const { locale, file: relativeFilePath } of localeScopedResourceFileEntries) {
    const absolutePath = fromRoot(relativeFilePath);
    if (!existsSync(absolutePath)) continue;

    const source = readFileSync(absolutePath, "utf8");
    const extension = path.extname(relativeFilePath).toLowerCase();

    if (extension === ".html" || extension === ".vue") {
      const attributePattern = /\b(placeholder|title|alt|aria-label|aria-description|aria-placeholder|content)\s*=\s*["']([^"']+)["']/giu;
      const textPattern = />([^<>]+)</gu;

      for (const match of source.matchAll(attributePattern)) {
        scanLocaleResourceValue({
          issues,
          locale,
          file: relativeFilePath,
          line: locateLine(source, match[0]),
          text: match[2],
        });
      }

      for (const match of source.matchAll(textPattern)) {
        scanLocaleResourceValue({
          issues,
          locale,
          file: relativeFilePath,
          line: locateLine(source, match[1]),
          text: match[1],
        });
      }
      continue;
    }

    const sourceFile = parseSourceFile(relativeFilePath, source);
    const visitAllStrings = (node, activeLocale = locale) => {
      if (ts.isPropertyAssignment(node)) {
        const propertyLocale = scopedPropertyLocale(propertyNameText(node.name));
        visitAllStrings(node.initializer, propertyLocale || activeLocale);
        return;
      }

      const staticValue = readStaticString(node);
      if (staticValue !== null) {
        scanLocaleResourceValue({
          issues,
          locale: activeLocale,
          file: relativeFilePath,
          line: nodeLine(sourceFile, node),
          text: staticValue,
        });
        return;
      }

      ts.forEachChild(node, (child) => visitAllStrings(child, activeLocale));
    };

    visitAllStrings(sourceFile);
  }

  return issues;
};

const listFiles = (startPath) => {
  if (!existsSync(startPath)) return [];
  const stats = readdirSafe(startPath);
  if (!stats) return [];

  const files = [];
  const walk = (currentPath) => {
    const entries = readdirSafe(currentPath);
    if (!entries) return;
    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
      } else if (entry.isFile()) {
        files.push(absolutePath);
      }
    }
  };

  walk(startPath);
  return files;
};

const readdirSafe = (directoryPath) => {
  try {
    return readdirSync(directoryPath, { withFileTypes: true });
  } catch {
    return null;
  }
};

const hardcodedTargetFiles = () => {
  const extensions = new Set(config.hardcoded?.extensions || []);
  const files = new Set();

  for (const includeDirectory of config.hardcoded?.includeDirectories || []) {
    for (const file of listFiles(fromRoot(includeDirectory))) files.add(file);
  }

  for (const includeFile of config.hardcoded?.includeFiles || []) {
    const file = fromRoot(includeFile);
    if (existsSync(file)) files.add(file);
  }

  return [...files]
    .filter((file) => extensions.has(path.extname(file).toLowerCase()))
    .filter((file) => {
      const relative = toPosix(path.relative(rootDir, file));
      if (localeScopedResourceFileSet.has(relative)) return false;
      return !hardcodedExcludePathPatterns.some((pattern) => pattern.test(relative));
    });
};

const shouldIgnoreHardcodedText = (text) => {
  const normalized = normalizeText(text);
  if (!normalized) return true;
  if (!hasAsciiLetter(normalized) && !hasChinese(normalized)) return true;
  if (hardcodedIgnoredTextPatterns.some((pattern) => testRegex(pattern, normalized))) return true;
  if (isFullyAllowlisted(normalized, "zh-CN") || isFullyAllowlisted(normalized, "en-US")) return true;
  return false;
};

const addHardcodedIssue = ({ issues, file, line, text, reason }) => {
  const normalized = normalizeText(text);
  if (shouldIgnoreHardcodedText(normalized)) return;

  issues.push({
    type: "Hardcoded user-facing string",
    locale: "N/A",
    file,
    line,
    url: "N/A",
    selector: "N/A",
    text: normalized,
    reason,
    suggestedFix: "Move this user-facing copy into src/i18n/translations.ts or another approved i18n translation resource, then render it through the locale helper.",
  });
};

const scanUserFacingInitializer = ({ sourceFile, node, issues, relativeFilePath, reason }) => {
  if (!node) return;

  if (ts.isPropertyAssignment(node)) {
    scanUserFacingInitializer({ sourceFile, node: node.initializer, issues, relativeFilePath, reason });
    return;
  }

  const staticValue = readStaticString(node);
  if (staticValue !== null) {
    addHardcodedIssue({
      issues,
      file: relativeFilePath,
      line: nodeLine(sourceFile, node),
      text: staticValue,
      reason,
    });
    return;
  }

  ts.forEachChild(node, (child) =>
    scanUserFacingInitializer({ sourceFile, node: child, issues, relativeFilePath, reason }),
  );
};

const scanTsLikeHardcodedFile = (absolutePath) => {
  const relativeFilePath = toPosix(path.relative(rootDir, absolutePath));
  const source = readFileSync(absolutePath, "utf8");
  const sourceFile = parseSourceFile(relativeFilePath, source);
  const issues = [];

  const scanRenderedExpression = (node, reason) => {
    if (!node) return;

    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      addHardcodedIssue({
        issues,
        file: relativeFilePath,
        line: nodeLine(sourceFile, node),
        text: node.text,
        reason,
      });
      return;
    }

    if (ts.isTemplateExpression(node)) {
      const text = [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join("${...}");
      addHardcodedIssue({
        issues,
        file: relativeFilePath,
        line: nodeLine(sourceFile, node),
        text,
        reason,
      });
      return;
    }

    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node)) {
      scanRenderedExpression(node.expression, reason);
      return;
    }

    if (ts.isConditionalExpression(node)) {
      scanRenderedExpression(node.whenTrue, reason);
      scanRenderedExpression(node.whenFalse, reason);
      return;
    }

    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      scanRenderedExpression(node.left, reason);
      scanRenderedExpression(node.right, reason);
      return;
    }

    if (ts.isBinaryExpression(node) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind)) {
      scanRenderedExpression(node.right, reason);
      return;
    }

    if (ts.isArrayLiteralExpression(node)) {
      for (const element of node.elements) scanRenderedExpression(element, reason);
    }
  };

  const visit = (node, context = {}) => {
    if (ts.isJsxText(node)) {
      addHardcodedIssue({
        issues,
        file: relativeFilePath,
        line: nodeLine(sourceFile, node),
        text: node.getText(),
        reason: "Visible JSX text is hardcoded in a component or page.",
      });
      return;
    }

    if (ts.isJsxAttribute(node)) {
      const attributeName = propertyNameText(node.name);
      if (hardcodedJsxAttributes.has(attributeName) && node.initializer) {
        if (ts.isStringLiteral(node.initializer)) {
          addHardcodedIssue({
            issues,
            file: relativeFilePath,
            line: nodeLine(sourceFile, node.initializer),
            text: node.initializer.text,
            reason: `JSX attribute "${attributeName}" contains hardcoded user-facing copy.`,
          });
        } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          scanRenderedExpression(node.initializer.expression, `JSX attribute "${attributeName}" contains hardcoded user-facing copy.`);
        }
      }
      return;
    }

    if (ts.isJsxExpression(node) && node.expression) {
      scanRenderedExpression(node.expression, "JSX expression contains hardcoded user-facing copy.");
      return;
    }

    if (ts.isPropertyAssignment(node)) {
      const propertyName = propertyNameText(node.name);
      if (hardcodedObjectPropertyNames.has(propertyName)) {
        scanUserFacingInitializer({
          sourceFile,
          node: node.initializer,
          issues,
          relativeFilePath,
          reason: `Object property "${propertyName}" looks like user-facing copy and is hardcoded.`,
        });
        return;
      }
    }

    if (ts.isCallExpression(node)) {
      const calleeName = node.expression.getText(sourceFile).split(".").pop();
      if (hardcodedMessageCallNames.has(calleeName)) {
        for (const argument of node.arguments) {
          scanUserFacingInitializer({
            sourceFile,
            node: argument,
            issues,
            relativeFilePath,
            reason: `Call "${calleeName}" contains hardcoded toast, error, success, or status copy.`,
          });
        }
        return;
      }
    }

    ts.forEachChild(node, (child) => visit(child, context));
  };

  visit(sourceFile);
  return issues;
};

const scanHtmlLikeHardcodedFile = (absolutePath) => {
  const relativeFilePath = toPosix(path.relative(rootDir, absolutePath));
  const source = readFileSync(absolutePath, "utf8");
  const issues = [];
  const attributePattern = /\b(placeholder|title|alt|aria-label|aria-description|aria-placeholder)\s*=\s*["']([^"']+)["']/giu;
  const textPattern = />([^<>]+)</gu;

  for (const match of source.matchAll(attributePattern)) {
    addHardcodedIssue({
      issues,
      file: relativeFilePath,
      line: locateLine(source, match[0]),
      text: match[2],
      reason: `HTML/template attribute "${match[1]}" contains hardcoded user-facing copy.`,
    });
  }

  for (const match of source.matchAll(textPattern)) {
    addHardcodedIssue({
      issues,
      file: relativeFilePath,
      line: locateLine(source, match[1]),
      text: match[1],
      reason: "HTML/template visible text is hardcoded.",
    });
  }

  return issues;
};

const checkHardcodedStrings = () => {
  const issues = [];

  for (const absolutePath of hardcodedTargetFiles()) {
    const extension = path.extname(absolutePath).toLowerCase();
    if (extension === ".html" || extension === ".vue") {
      issues.push(...scanHtmlLikeHardcodedFile(absolutePath));
    }

    if ([".ts", ".tsx", ".js", ".jsx"].includes(extension)) {
      issues.push(...scanTsLikeHardcodedFile(absolutePath));
    }
  }

  return issues;
};

const isHealthy = async (url) => {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
};

const waitForHealthy = async (url, timeoutMs) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isHealthy(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Runtime locale scan server did not become ready at ${url} within ${timeoutMs}ms.`);
};

const waitForExit = async (child, timeoutMs = 3000) => {
  if (child.exitCode !== null || child.signalCode !== null) return;

  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, timeoutMs);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
};

const stopChildProcess = async (child) => {
  if (child.exitCode !== null || child.signalCode !== null) return;

  const pid = child.pid;
  if (!pid) return;

  try {
    if (process.platform === "win32") {
      child.kill();
    } else {
      process.kill(-pid, "SIGTERM");
    }
  } catch {
    child.kill();
  }

  await waitForExit(child);

  if (child.exitCode !== null || child.signalCode !== null) return;

  try {
    if (process.platform === "win32") {
      child.kill("SIGKILL");
    } else {
      process.kill(-pid, "SIGKILL");
    }
  } catch {
    child.kill("SIGKILL");
  }

  await waitForExit(child);
};

const launchRuntimeServer = async () => {
  const baseUrl = process.env.I18N_RUNTIME_BASE_URL || config.runtime.baseUrl;

  if (await isHealthy(baseUrl)) {
    return { baseUrl, stop: async () => {} };
  }

  const commandText = process.env.I18N_RUNTIME_SERVER_COMMAND || config.runtime.serverCommand;
  const child = spawn(commandText, {
    cwd: rootDir,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
    env: {
      ...process.env,
      BROWSER: "none",
    },
  });

  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
    if (output.length > 8000) output = output.slice(-8000);
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
    if (output.length > 8000) output = output.slice(-8000);
  });

  try {
    await waitForHealthy(baseUrl, config.runtime.startupTimeoutMs || 45_000);
  } catch (error) {
    await stopChildProcess(child);
    throw new Error(`${error.message}\nServer output:\n${output}`);
  }

  return {
    baseUrl,
    stop: async () => {
      await stopChildProcess(child);
    },
  };
};

const launchBrowser = async () => {
  const channels = process.env.PLAYWRIGHT_CHROMIUM_CHANNEL
    ? [process.env.PLAYWRIGHT_CHROMIUM_CHANNEL]
    : [undefined, "chrome", "msedge"];
  let lastError;

  for (const channel of channels) {
    try {
      return await chromium.launch({
        headless: true,
        ...(channel ? { channel } : {}),
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

const scanRenderedText = (text, locale) => {
  const normalized = normalizeText(text);
  if (!normalized || isFullyAllowlisted(normalized, locale)) return null;

  if (locale === "en-US") {
    const leak = findChineseLeak(normalized, locale);
    if (!leak) return null;
    return {
      reason: "en-US rendered DOM contains Chinese characters.",
      suggestedFix: "Move this text to the zh-CN resource or ensure the en-US page reads the English translation field.",
    };
  }

  if (locale === "zh-CN") {
    const leak = findEnglishLeak(normalized, locale);
    if (!leak) return null;
    return {
      reason: `zh-CN rendered DOM contains an unauthorized English phrase: "${leak}".`,
      suggestedFix: "Translate the text, fix the runtime fallback, or add a narrow allowlist entry only for approved brand, technical, URL, email, version, or code text.",
    };
  }

  return null;
};

const checkRuntimeDom = async () => {
  const issues = [];
  const server = await launchRuntimeServer();
  let browser;

  try {
    browser = await launchBrowser();
    const scanAttributes = config.runtime.scanAttributes || [];
    const ignoredSelectors = config.runtime.ignoredSelectors || [];

    for (const route of config.runtime.routes || []) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const url = `${server.baseUrl}${route.url}`;

      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: config.runtime.navigationTimeoutMs || 30_000,
        });
        await page.waitForLoadState("load", { timeout: config.runtime.navigationTimeoutMs || 30_000 }).catch(() => {});
        await page.waitForTimeout(500);

        const rendered = await page.evaluate(({ scanAttributes, ignoredSelectors }) => {
          const ignoredSelectorText = ignoredSelectors.join(",");
          const isIgnored = (element) => Boolean(ignoredSelectorText && element.closest(ignoredSelectorText));
          const isVisible = (element) => {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
          };
          const selectorFor = (element) => {
            if (element.id) return `#${CSS.escape(element.id)}`;
            const parts = [];
            let current = element;
            while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body && parts.length < 5) {
              const tag = current.tagName.toLowerCase();
              const parent = current.parentElement;
              if (!parent) {
                parts.unshift(tag);
                break;
              }
              const sameTagSiblings = Array.from(parent.children).filter((child) => child.tagName === current.tagName);
              const index = sameTagSiblings.indexOf(current) + 1;
              parts.unshift(sameTagSiblings.length > 1 ? `${tag}:nth-of-type(${index})` : tag);
              current = parent;
            }
            return parts.join(" > ") || element.tagName.toLowerCase();
          };

          const results = [];
          for (const element of Array.from(document.querySelectorAll("body *"))) {
            if (isIgnored(element) || !isVisible(element)) continue;
            const visibleChildWithText = Array.from(element.children).some((child) => isVisible(child) && child.innerText?.trim());
            const text = element.innerText?.trim();
            if (text && !visibleChildWithText) {
              results.push({
                selector: selectorFor(element),
                text,
                source: "visible text",
              });
            }

            for (const attribute of scanAttributes) {
              const value = element.getAttribute(attribute);
              if (!value?.trim()) continue;
              results.push({
                selector: `${selectorFor(element)}[${attribute}]`,
                text: value,
                source: attribute,
              });
            }
          }

          return results;
        }, { scanAttributes, ignoredSelectors });

        for (const item of rendered) {
          const result = scanRenderedText(item.text, route.locale);
          if (!result) continue;
          issues.push({
            type: "Runtime DOM locale scan",
            locale: route.locale,
            file: "N/A",
            line: "N/A",
            url: route.url,
            selector: item.selector,
            text: normalizeText(item.text).slice(0, 300),
            reason: result.reason,
            suggestedFix: result.suggestedFix,
          });
        }
      } catch (error) {
        issues.push({
          type: "Runtime DOM locale scan",
          locale: route.locale,
          file: "N/A",
          line: "N/A",
          url: route.url,
          selector: "N/A",
          text: "N/A",
          reason: `Runtime scan could not open this route: ${error instanceof Error ? error.message : String(error)}`,
          suggestedFix: "Make sure the route renders locally, then rerun npm run i18n:check:runtime.",
        });
      } finally {
        await page.close().catch(() => {});
      }
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    await server.stop();
  }

  return issues;
};

const runCheck = async (name) => {
  switch (name) {
    case "keys":
      return checkTranslationKeys();
    case "resources":
      return checkResourcePurity();
    case "hardcoded":
      return checkHardcodedStrings();
    case "runtime":
      return checkRuntimeDom();
    default:
      throw new Error(`Unsupported check: ${name}`);
  }
};

const run = async () => {
  const checks = command === "all" ? ["keys", "resources", "hardcoded", "runtime"] : [command];
  const issues = [];

  for (const checkName of checks) {
    const checkIssues = await runCheck(checkName);
    issues.push(...checkIssues);
  }

  const uniqueIssues = dedupeIssues(issues);
  if (uniqueIssues.length > 0) {
    printIssues(uniqueIssues);
    console.error(`i18n locale integrity check failed with ${uniqueIssues.length} issue(s).`);
    process.exit(1);
  }

  if (command === "all") {
    console.log("i18n locale integrity check passed.");
  } else {
    console.log(`i18n locale integrity ${command} check passed.`);
  }
};

run().catch((error) => {
  console.error("Type: Tool failure");
  console.error("Locale: N/A");
  console.error("File: N/A");
  console.error("Line: N/A");
  console.error("URL: N/A");
  console.error("Selector: N/A");
  console.error("Text: N/A");
  console.error(`Reason: ${error instanceof Error ? error.message : String(error)}`);
  console.error("Suggested fix: Fix the checker setup or local runtime prerequisite, then rerun the i18n check.");
  process.exit(1);
});

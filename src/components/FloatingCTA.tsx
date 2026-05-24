import WhatsAppIcon from "@/components/WhatsAppIcon";

const FloatingCTA = () => {
  return (
    <a
      href="https://wa.me/60123456789"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center w-14 h-14 sm:w-auto sm:h-auto sm:px-5 sm:py-3 bg-[#25D366] text-white rounded-full shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 animate-fade-in"
      style={{ animationDelay: "1s", opacity: 0 }}
      aria-label="Chat on WhatsApp"
    >
      <WhatsAppIcon className="w-7 h-7 sm:w-5 sm:h-5" />
      <span className="hidden sm:inline text-sm font-semibold ml-2">WhatsApp Us</span>
    </a>
  );
};

export default FloatingCTA;

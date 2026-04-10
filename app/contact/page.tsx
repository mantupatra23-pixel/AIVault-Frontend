export default function Contact() {
  return (
    <div className="bg-[#fcfcfc] min-h-screen flex items-center justify-center py-20 px-6">
      <div className="max-w-2xl w-full bg-white border border-gray-100 p-12 md:p-20 rounded-[4rem] shadow-2xl shadow-blue-100/50">
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-6 text-center">Get in Touch.</h1>
        <p className="text-center text-gray-400 mb-12 font-medium italic">Have a tool to list? Or a business query?</p>
        
        <div className="space-y-8">
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 block mb-2">Primary Email</span>
            <a href="mailto:support@aivault.app" className="text-2xl md:text-3xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              support@aivault.app
            </a>
          </div>

          <div className="text-center pt-8 border-t border-gray-50">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 block mb-2">Headquarters</span>
            <p className="text-xl font-bold text-gray-900">Brahmapur, Odisha, India 🇮🇳</p>
          </div>
        </div>
      </div>
    </div>
  );
}

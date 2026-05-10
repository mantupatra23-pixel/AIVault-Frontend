export default function Contact() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] px-6">
      <div className="bg-white border border-gray-100 p-12 md:p-20 rounded-[60px] shadow-2xl shadow-black/5 text-center max-w-2xl w-full">
        <h2 className="text-5xl font-[1000] italic uppercase mb-4 tracking-tighter">Get in Touch<span className="text-blue-600">.</span></h2>
        <p className="text-gray-400 text-sm mb-12 italic">Have a tool to list? Or a business query?</p>
        
        <div className="space-y-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2 block">Primary Email</span>
            <a href="mailto:mantupatra23@gmail.com" className="text-2xl md:text-3xl font-black text-gray-900 hover:text-blue-600 transition-all">mantupatra23@gmail.com</a>
          </div>
          
          <div className="pt-8 border-t border-gray-50">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-2 block">Headquarters</span>
            <p className="font-bold text-gray-900">Brahmapur, Odisha, India 🇮🇳</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function About() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter mb-12">
          The Mission<span className="text-blue-600">.</span>
        </h1>
        
        <div className="prose prose-xl prose-slate">
          <p className="text-2xl font-medium text-gray-600 leading-relaxed mb-8">
            AIVault is a high-performance directory built to bridge the gap between human creativity and Artificial Intelligence. 
          </p>
          <p className="text-gray-500 mb-8">
            Founded by <strong>Mantu Patra</strong>, an AI Automation expert and entrepreneur based in India, this platform is designed to help 10Cr+ creators find the right tools to build the future. 
          </p>
          <p className="text-gray-500 mb-12">
            Humara maqsad hai ki AI technology ko har Indian creator aur developer ke liye accessible aur aasan banaya jaye. 
          </p>
        </div>

        <div className="bg-blue-600 p-12 rounded-[3rem] text-white">
          <h2 className="text-3xl font-black mb-4 italic">"Make in India, For the World."</h2>
          <p className="font-bold opacity-80 uppercase tracking-widest text-xs">- Mantu Patra</p>
        </div>
      </div>
    </div>
  );
}

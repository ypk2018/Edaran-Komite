import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.post("/api/generate-letter", async (req, res) => {
  try {
    const { prompt, currentContent } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Anda adalah asisten administrasi sekolah untuk SMP Negeri 7 Sentani, Papua. Tugas Anda adalah membantu menulis atau menyempurnakan surat edaran resmi sekolah.
Instruksi pengguna: ${prompt}
Konten surat saat ini (jika ada): ${currentContent || ''}
Berikan hasil isi surat resmi (dalam format HTML sederhana seperti tabel/paragraf dengan placeholder yang sesuai seperti {NAMA_SISWA}, {KELAS}, {NOMINAL}, {TERBILANG}) yang profesional, formal, dan sesuai standar surat dinas pendidikan Indonesia. Hanya berikan isi teks suratnya saja tanpa basa-basi pembuka.`,
    });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Gagal menghasilkan surat dengan AI" });
  }
});

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.middlewares);

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

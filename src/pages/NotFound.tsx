import { Link } from "react-router-dom";
import PageMeta from "@/components/common/PageMeta";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <PageMeta title="Halaman Tidak Ditemukan" description="" />
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 bg-muted/30">
        <div className="mx-auto w-full max-w-[472px] text-center space-y-8">
          <h1 className="text-8xl font-black text-primary/20 leading-none">
            404
          </h1>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary italic uppercase tracking-widest">Halaman Tidak Ditemukan</h2>
            <p className="text-base text-muted-foreground sm:text-lg">
              Maaf, halaman yang Anda cari mungkin telah dihapus, dipindahkan, atau tidak pernah ada. Silakan periksa kembali URL Anda.
            </p>
          </div>

          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link to="/">Kembali ke Beranda</Link>
          </Button>
        </div>
        <p className="absolute text-xs text-center text-muted-foreground bottom-6 left-0 right-0">
          &copy; 2026 NU Malaysia Media & PMI Advocacy
        </p>
      </div>
    </>
  );
}

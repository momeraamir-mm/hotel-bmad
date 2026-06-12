import Image from "next/image";
import { Phone, Sparkles } from "lucide-react";

export function BrandHeader() {
  return (
    <header className="brand-gradient text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white">
            <Image
              src="/brand/elite-logo.jpeg"
              alt="Elite Tour House Makkah"
              width={48}
              height={48}
              className="h-12 w-12 object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Elite Tour House Makkah</h1>
            <p className="flex items-center gap-1.5 text-xs text-brand-light/90">
              <Sparkles className="h-3 w-3" /> AI Reservation Assistant
            </p>
          </div>
        </div>
        <a
          href="tel:+966567368048"
          className="hidden items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-sm text-white/90 transition hover:bg-white/10 sm:flex"
        >
          <Phone className="h-3.5 w-3.5" />
          +966 56 736 8048
        </a>
      </div>
    </header>
  );
}

import { useState } from "react";
import Modal from "./Modal";
import { BUILD_PASS_REGISTRY } from "../lib/build-pass-service";

/** ---------- Complete Orator Build Pass Modal (49, 99, 199) ---------- */

interface Props {
  clientId: string;
  explorationsCompleted: number;
  onGrantPass: (tierId: "single" | "builder" | "studio") => void;
  onClose: () => void;
}

export default function BuildPassModal({
  clientId,
  explorationsCompleted,
  onGrantPass,
  onClose,
}: Props) {
  const [selectedTier, setSelectedTier] = useState<"single" | "builder" | "studio">("builder");
  const [ack, setAck] = useState(false);

  const tiers = Object.values(BUILD_PASS_REGISTRY);

  const handleSelect = (tierId: "single" | "builder" | "studio") => {
    setSelectedTier(tierId);
  };

  const handleConfirm = () => {
    onGrantPass(selectedTier);
  };

  return (
    <Modal
      title="COMPLETE ORATOR BUILD PASSES"
      subtitle={
        explorationsCompleted >= 3
          ? "You have completed your three included Design Explorations. Select a verified Build Pass to move into a Complete Orator Build."
          : "Ready to move from Design Exploration into a Complete Orator Build? Select a verified Build Pass to generate, verify, and export your application."
      }
      onClose={onClose}
    >
      <div className="space-y-2.5">
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.id;
          return (
            <div
              key={tier.id}
              onClick={() => handleSelect(tier.id as "single" | "builder" | "studio")}
              className={`cursor-pointer rounded-lg border p-3.5 transition-all ${
                isSelected
                  ? "border-forge-cyan bg-forge-cyan/10 shadow-[0_0_15px_rgba(53,224,255,0.15)]"
                  : "border-seam/70 bg-depth/60 hover:border-seam"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-forge-cyan" : "bg-forge-dim"}`} />
                  <span className="font-mono-hud text-[11px] font-bold tracking-[0.14em] text-pearl">
                    {tier.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-depth/80 px-2 py-0.5 font-mono-hud text-[9px] tracking-widest text-forge-gold">
                    {tier.badge}
                  </span>
                  <span className="font-mono-hud text-sm font-bold text-forge-cyan">
                    ${tier.priceUsd}
                  </span>
                </div>
              </div>
              <p className="mt-1.5 text-[11px] text-forge-dim pl-4">{tier.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-md border border-forge-gold/30 bg-forge-gold/10 p-2.5 text-[10.5px] leading-relaxed text-forge-gold/90">
        <span className="font-bold">No recurring subscriptions or permanent hosting lock-in:</span> Passes are one-time build session allocations consumed only after final verified delivery.
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#35e0ff]"
        />
        <span className="font-mono-hud text-[9.5px] leading-relaxed tracking-[0.04em] text-forge-dim">
          Payment processing is not connected during this evaluation phase. Acknowledging grants an evaluation Complete Build pass without charging a credit card.
        </span>
      </label>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!ack}
        className="btn-forge btn-primary mt-5 w-full px-4 py-3 text-[11px]"
      >
        SELECT {BUILD_PASS_REGISTRY[selectedTier]?.name.toUpperCase()} (${BUILD_PASS_REGISTRY[selectedTier]?.priceUsd})
      </button>
    </Modal>
  );
}

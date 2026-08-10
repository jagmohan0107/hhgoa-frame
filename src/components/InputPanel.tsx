interface InputPanelProps {
  name: string;
  role: string;
  onNameChange: (v: string) => void;
  onRoleChange: (v: string) => void;
}

export default function InputPanel({ name, role, onNameChange, onRoleChange }: InputPanelProps) {
  return (
    <div className="w-full flex flex-col gap-5">
      <label className="block">
        <span className="block font-display text-xs tracking-[0.2em] text-gold mb-2">
          YOUR NAME
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="JAGMOHAN PALI"
          maxLength={40}
          className="w-full rounded-2xl bg-white/10 border border-seafoam/30 px-5 py-4 text-sand
                     placeholder:text-sand/30 font-body text-lg tracking-wide
                     focus:bg-white/15 focus:border-gold transition-colors outline-none"
        />
      </label>

      <label className="block">
        <span className="block font-display text-xs tracking-[0.2em] text-gold mb-2">
          YOUR ROLE / STACK
        </span>
        <input
          type="text"
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          placeholder="AI/ML DEVELOPER"
          maxLength={40}
          className="w-full rounded-2xl bg-white/10 border border-seafoam/30 px-5 py-4 text-sand
                     placeholder:text-sand/30 font-body text-lg tracking-wide
                     focus:bg-white/15 focus:border-gold transition-colors outline-none"
        />
      </label>
    </div>
  );
}

import { InnovationBoard } from '@/components/innovation/InnovationBoard';

export function Tasks() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Innovations</h1>
        <p className="text-sm text-gray-500 mt-1">Research and innovation pipeline for the team</p>
      </div>
      <InnovationBoard />
    </div>
  );
}
import { GrantsManager } from '@/components/grants/GrantsManager';

export function Grants() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Grants Portal</h1>
        <p className="text-sm text-gray-500 mt-1">Manage grants by pillar with AI-powered writing assistance</p>
      </div>
      <GrantsManager />
    </div>
  );
}
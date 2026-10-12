import React from 'react';

export default function PlatformLogo({ tech, zIndex, className = '' }: { tech: string, zIndex?: number, className?: string }) {
  const [error, setError] = React.useState(false);
  
  const aliasMap: Record<string, string> = {
    'gcp': 'gcp',
    'googlecloud': 'gcp',
    'googlecloudplatform': 'gcp',
    'aws': 'aws',
    'amazonwebservices': 'aws',
    'digitalocean': 'digitalocean',
    'do': 'digitalocean',
    'postgres': 'postgresql',
    'postgresql': 'postgresql',
    'vuejs': 'vue',
    'reactjs': 'react',
    'nextjs': 'nextjs',
    'next': 'nextjs',
    'node': 'nodejs',
    'nodejs': 'nodejs',
    'dotnet': 'dotnet',
    '.net': 'dotnet',
    'c#': 'csharp',
    'csharp': 'csharp',
    'c++': 'cpp',
    'cpp': 'cpp',
    'js': 'javascript',
    'ts': 'typescript',
    'imagekit': 'imagekit',
    'cloudinary': 'cloudinary',
  };

  const rawClean = tech.toLowerCase().replace(/[^a-z0-9#+.]/g, '');
  const finalName = aliasMap[rawClean] || tech.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (error) {
    return (
      <div 
        className={`w-8 h-8 rounded-full bg-[var(--bg-surface-tint)] shadow-sm border border-white flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] relative ${className}`} 
        title={tech}
        style={zIndex !== undefined ? { zIndex } : undefined}
      >
        {tech.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div 
      className={`w-8 h-8 rounded-full bg-white shadow-sm border border-white p-1 flex items-center justify-center overflow-hidden relative ${className}`} 
      title={tech}
      style={zIndex !== undefined ? { zIndex } : undefined}
    >
      <img 
        src={`/logos/${finalName}.png`} 
        alt={tech} 
        className="w-full h-full object-contain"
        onError={() => setError(true)}
      />
    </div>
  );
}


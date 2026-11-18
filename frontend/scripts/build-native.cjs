const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Build separately: never move tracked auth routes or modify the web build's types.
const root = path.resolve(__dirname, '..');
const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'pulselogic-native-'));
try {
    for (const entry of ['app', 'components', 'hooks', 'lib', 'public', 'types', 'pages',
        'package.json', 'tsconfig.json', 'next-env.d.ts', 'next.config.js', 'tailwind.config.js',
        'postcss.config.js', '.env', '.env.local']) {
        const source = path.join(root, entry);
        if (fs.existsSync(source)) fs.cpSync(source, path.join(staging, entry), {
            recursive: true, filter: candidate => candidate !== path.join(root, 'app', 'api'),
        });
    }
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(staging, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    const configPath = path.join(staging, 'tsconfig.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.include = ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'];
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    const result = spawnSync(process.execPath, [require.resolve('next/dist/bin/next'), 'build'], {
        cwd: staging, stdio: 'inherit', env: { ...process.env, MOBILE_BUILD: 'true', NEXT_PUBLIC_MOBILE_BUILD: 'true', NEXT_BUILD_DIR: '.next' },
    });
    process.exitCode = result.status ?? 1;
    if (result.status === 0) {
        fs.mkdirSync(path.join(root, 'out'), { recursive: true });
        fs.cpSync(path.join(staging, 'out'), path.join(root, 'out'), { recursive: true });
    }
} finally {
    fs.rmSync(staging, { recursive: true, force: true });
}

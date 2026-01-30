module.exports = {
    apps: [
        {
            name: 'edurinconai',
            script: 'npm',
            args: 'start',
            cwd: '/home/isard/workspace/EduRinconAI',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            }
        }
    ]
};

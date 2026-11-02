const { msg } = require('oho-console');
const readline = require('readline');

function commandPrompt (server) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    rl.setPrompt('command > ');
    rl.prompt();

    rl.on('line', async (line) => {
        const input = line.trim();
        const [command, ...args] = input.split(' ');

        if (!command) return;

        switch (command) {
            case 'stop':
                await server.close(() => msg.info('The server is stopping...'));
                process.exit();
            default:
                msg.error(`${command} is not a valid command!`);
                break;
        }
    })
}

module.exports = { commandPrompt };
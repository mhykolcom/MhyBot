const Discord = require('discord.js')
let activeQueues = [];
/**
 * slots : number = of slots to set
 * slot_options : string[] = Valid values for being added to a slot
 * slots_defined : boolean = set slot_options as default slot names (make sure slot_options.length == slots (size))
 * icon : ?string = A URL to an icon/image
 * color: ?string = Color of the embed (hex (and maybe color names? Dont remember... CBA to test it))
 *
 *
 * @type {{among_us: {num_slots: number, slot_options: string[], color: ?string, icon: ?string, slots_defined: boolean}, colors: {num_slots: number, slot_options: string[], color: ?string, icon: ?string, slots_defined: boolean}}}
 */
const templates = {
    'among_us': {
        num_slots: 10,
        slot_options: ['red', 'brown', 'orange', 'yellow', 'pink', 'purple', 'blue', 'cyan', 'green', 'lime', 'white', 'black'],
        slots_defined: false,
        icon: null,
        color: null,
    },
    'colors': {
        num_slots: 8,
        slot_options: ['red', 'brown', 'orange', 'yellow', 'pink', 'purple', 'blue', 'cyan'],
        slots_defined: true,
        icon: null,
        color: "#ef6702",
    },
}

// TODO: ...
//   - Add server check for all queues
//   - Settings for role configs (roles allowed to join open, roles that can roll, etc)
//   - Add subcommand: open_rolls
//   - Only creator can
//     - close a queue
//     - open_rolls

// Ideas: ...
//   - Maybe a way to add new templates?
//

let lastSimRoll = 0;

module.exports = {
    name: 'roll',
    category: "Fun",
    description: 'Create a queue/list for various uses',
    aliases: ['r'],
    args: true,
    usage: [
        '',
        'open <slot count> [<time> [<prox> [<max_roll> [<asc|desc>]]]]',
        'status',
        'reopen',
        'close [<@role>]',
        'clear',
    ],
    allowNoSubcommand: true,
    permission: 'user',
    execute(client, message, args) {
        /**
         *
         * @param size : int
         * @param maxRoll : int
         * @param order : string
         * @param time : ?int
         * @param prox : boolean
         * @return {boolean}
         */
        function createQueue(size, time = null, prox = false, maxRoll=20, order='desc') {
            client.logger.debug('Creating a queue');

            let newQueue = {
                creator: {
                    name: message.author.username,
                    icon: message.author.avatarURL(),
                },
                description: `<@&${client.configs.among_us.patreon_role_mention}>:\n**${size} slots open**`,
                size: size,
                max_roll: maxRoll,
                sort_order: order,
                prox_chat: prox,
                slots: {},
                slot_options: [],
                slots_defined: false,
                rolls: {},
                icon: null,
                color: null,
                open: true,
            };

            if (time) { newQueue.description += ` || Closes in ${time} mins.` }
            if (prox) { newQueue.description += `\nUsing prox tonight: ${client.configs.among_us.better_crew_link}`}
            // if (title) { newQueue.description += `${title}\n` }
            newQueue.description += '\n\n'
            if (prox) {
                newQueue.description += 'Please have the prox software running and setup (details in private chat), the game launched, and in voice chat, ready to play by 9\n';
            } else {
                newQueue.description += 'Please have the game launched, and in voice chat, ready to play by 9\n';
            }
            newQueue.description += 'Only roll if you are able to play!\n\n' +
                `*${size} **${order=='desc'?'highest':'lowest'}** rolls will be selected*\n` +
                `Use \`${client.currentserver.prefix}roll\` (has a max roll of ${maxRoll})\n`
            ;

            // client.logger.verbose(`creating a ${size} slot queue with a title of "${title}"`)
            client.logger.verbose(`creating a ${size} slot queue`)
            // let count = activeQueues.push(newQueue);
            activeQueues[0]=newQueue;

            message.channel.send(newQueue.description);
        }

        function roll() {
            let author = message.author;

            if (!activeQueues.length || !activeQueues[0].open) {
                message.reply(`(${author.username}) There is no active queue right now`);
                return;
            }

            if (author.id in activeQueues[0].slots) {
                message.reply(`(${author.username}) You have already rolled for this queue`);
                return;
            }

            let roll = doRoll(activeQueues[0].max_roll, author);
            message.reply(author.username + ': You rolled a ' + roll);
        }

        function doRoll(maxRoll, author) {
            const getRand = (min, max) => parseInt(Math.random() * (max - min) + min);
            const rand = getRand(1, maxRoll);
            client.logger.debug(`${author.username}[${author.id}] rolled a ${rand}`);

            activeQueues[0].slots[author.id] = {
                author_id: author.id,
                author: author,
                roll: rand,
            }

            return rand;
        }

        function closeQueue() {
            activeQueues[0].open = false;
            message.channel.send('Queue closed');
        }

        function reopenQueue() {
            activeQueues[0].open = true;
            message.channel.send('Queue reopened');
        }

        function clearQueue() {
            delete activeQueues[0];
            lastSimRoll = 0;
            activeQueues = activeQueues.filter(_ => true);
            message.channel.send('Queue cleared');
        }

        function showQueue() {
            if (!activeQueues[0]) {
                message.reply('Queue isnt open');
                return false;
            }
            // let content = createQueueEmbed(activeQueues[0]);
            let content = listQueue(activeQueues[0]);
            message.channel.send(content);
        }

        function simRolls(count) {
            let rolls = []
            let max = activeQueues[0].max_roll;
            for (let i=0; i<count; i++) {
                rolls.push(doRoll(max, {
                    id: ''+(++lastSimRoll),
                    system: false,
                    locale: null,
                    flags: {bitfield: 640},
                    username: 'Person '+lastSimRoll,
                    bot: false,
                    discriminator: '9999',
                    avatar: 'a5f743f4e11ec2ee8d61fb0b81a7c577',
                    lastMessageID: '813672824031019048',
                    lastMessageChannelID: '410321479004323843'
                }));
            }

            message.channel.send('Rolls: ' + rolls.join(', '))
        }

        function sortRolls(queue) {
            let slots = Object.values(queue.slots);

            if (queue.sort_order == 'asc') {
                slots = slots.sort((a, b) => Math.sign(a.roll - b.roll))
            } else {
                slots = slots.sort((a, b) => Math.sign(b.roll - a.roll))
            }

            let rolls = []
            for (const slot of slots) {
                rolls.push([slot.author.username, slot.roll]);
            }

            return rolls;
        }

        function listQueue(queue) {
            let queueText = '';
            let rolls = sortRolls(queue);

            let topRolls = [];
            for (let i=0; i<queue.size; i++) { topRolls.push(rolls[i][1]); }
            let cutoff;
            let topRollCount;
            if (queue.sort_order == 'asc') {
                cutoff = Math.max(...topRolls);
                topRollCount = rolls.reduce((count, roll) => (roll[1] <= cutoff ? ++count : count), 0);
            } else {
                cutoff = Math.min(...topRolls);
                topRollCount = rolls.reduce((count, roll) => (roll[1] >= cutoff ? ++count : count), 0);
            }
            let cutoffCount = rolls.reduce((count, roll) => (roll[1] == cutoff ? ++count : count), 0);
            let tieBreakNeeded = topRollCount > queue.size;

            let givenLine = false;
            for (const [username, roll] of rolls) {
                if (!givenLine && ((queue.sort_order == 'asc' && roll > cutoff) || (queue.sort_order == 'desc' && roll < cutoff))) {
                    queueText += '------------------------------------\n';
                    givenLine = true;
                }
                queueText += `${username} - ${roll}`;
                if (roll == cutoff && tieBreakNeeded) {
                    queueText += ' [tie]';
                }
                queueText += '\n';
            }
            let returnText='**Roll Status**\n```' +
                queueText +
                '```';

            if (tieBreakNeeded) {
                let remaining = queue.size-(topRollCount-cutoffCount);
                if (remaining == 1) returnText += `\n**Tie breaker needed for the last slot**`;
                else returnText += `\n**Tie breaker needed for the last ${remaining} slots**`;

            }

            return returnText;
        }

        function createQueueEmbed(queue) {
            client.logger.debug('Creating queue embed');

            let queueText = '';
            let rolls = sortRolls(queue);
            console.log(rolls);
            for (const [username, roll] of rolls) {
                queueText += `${username} - ${roll}\n`;
            }

            return new Discord.MessageEmbed()
                .setColor(queue.color || '#0099ff')
                .setTitle('Roll Status')
                .setAuthor(queue.creator.name, queue.creator.icon)
                // .setDescription(queue.description)
                .addField('\u200B', queueText)
                .setImage(queue.icon)
                .setTimestamp()
            ;
        }

        if (!args.length) {
            roll();
        } else {
            let author_roles = message.member.roles.cache;
            let approved = false;
            for (const staff_role_id of client.configs.among_us.staff_roles) {
                if (author_roles.has(staff_role_id)) {
                    approved = true;
                    break;
                }
            }
            if (!approved) {
                message.reply(`You are not authorized to use this command. If you are trying to roll, please use just \`${client.currentserver.prefix}roll\``);
                return false;
            }

            const subcommand = args.shift().toLowerCase();
            switch (subcommand) {
                case 'sim':
                    simRolls(parseInt(args.shift()));
                    break;
                case 'open':
                    let open_args = [];

                    // Num slots
                    let size = args.shift();
                    if (Number.isNaN(parseInt(size))) {
                        message.reply('Number of slots should be numeric');
                        return false;
                    }
                    open_args.push(parseInt(size));

                    // Time
                    if (args.length) {
                        let time = args.shift();
                        if (time && Number.isNaN(parseInt(time))) {
                            message.reply('Time should be numeric');
                            return false;
                        }
                        open_args.push(parseInt(time));
                    }

                    // Prox
                    if (args.length) {
                        let prox = args.shift().toLowerCase();
                        if (['0', 'f', 'false', 'n', 'no'].includes(prox)) prox = false;
                        else if (['1', 't', 'true', 'y', 'yes'].includes(prox)) prox = true;
                        else {
                            message.reply('prox should be either left off (defaults to false) or set to one of: [\'0\', \'f\', \'false\', \'n\', \'no\', \'1\', \'t\', \'true\', \'y\', \'yes\']');
                            return false;
                        }
                        open_args.push(prox);
                    }

                    // Max Rolls
                    if (args.length) {
                        let maxRoll = args.shift();
                        if (maxRoll && Number.isNaN(parseInt(maxRoll))) {
                            message.reply('Max roll should be numeric');
                            return false;
                        }
                        open_args.push(parseInt(maxRoll));
                    }

                    // Sort order
                    if (args.length) {
                        let order = args.shift().toLowerCase();
                        if (order && (order != "asc" && order != "desc")) {
                            message.reply('Order must be asc or desc')
                            return false;
                        }
                        open_args.push(order);
                    }

                    createQueue(...open_args);
                    break;
                case 'close':
                    closeQueue(parseInt(args.join('')));
                    break;
                case 'reopen':
                    reopenQueue(parseInt(args.join('')));
                    break;
                case 'clear':
                    clearQueue(parseInt(args.join('')));
                    break;
                case 'status':
                    showQueue();
                    break;
                default:
                    client.logger.warn('unknown subcommand: ' + subcommand)
            }
        }

        // console.log('----------------\nmessage:\n', message, '\n----------------\nArgs:\n', args, '\n----------------\n');
        /*client.dbo.collection("queue").findOneAndUpdate(filter, {$set: options}, {new: true}, async function (err, result) {
            if (err)
                next(err)
            else {
                console.log("updated");
            }
        }).sort({createdAt: -1})*/
        /*client.dbo.collection("queue").updateOne({_id: client.currentserver._id}, {
            $push: {
                youtubeChannels: {
                    name: streamer,
                    id: channel.items[0].id,
                    title: channel.items[0].snippet.title,
                    icon: channel.items[0].snippet.thumbnails.default.url,
                    customurl: channel.items[0].snippet.customUrl,
                    uploadPlaylist: channel.items[0].contentDetails.relatedPlaylists.uploads,
                    messageid: null,
                    mention: dmention
                }
            }
        }, function (err, res) {
            if (err) throw err;
            message.reply("YouTube Channel Added: " + streamer);
            client.logger.info(`[${server.name}] YouTube Channel Added: ${streamer}`)
        })*/
    }
};

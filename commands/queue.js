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

module.exports = {
    name: 'queue',
    category: "Fun",
    description: 'Create a queue/list for various uses',
    aliases: ['q'],
    args: true,
    usage: [
        'create <slot count> [title]',
        'create template <name> [title]',
        'list',
        'show <queue number>',
        'close <queue number>',
        'yes|maybe [slot]',
        'yes|maybe [<queue number> (only required when multiple queues)] [slot]',
        'no [<queue number> (only required when multiple queues)]',
        'roll [<queue number> (only required when multiple queues)]',
    ],
    allowNoSubcommand: false,
    permission: 'admin',
    execute(client, message, args) {
        /**
         *
         * @param size : int
         * @param title : string
         * @param template_spec : ?object
         * @return {boolean}
         */
        function createQueue(size, title, template_spec=null) {
            if (size > 20) {
                // Arbitrary number for too large
                // Can be changed later
                message.reply('The queue size may not be larger than X');
                return false;
            }

            client.logger.debug('Creating a queue');

            const hasTemplate = !!template_spec;
            if (hasTemplate) client.logger.debug('Using template');

            let newQueue = {
                creator: {
                    name: message.author.username,
                    icon: message.author.avatarURL(),
                },
                title: title,
                description: `Total of **${size}** slots`,
                size: size,
                slots: {},
                slot_options: [],
                slots_defined: false,
                rolls: {},
                icon: null,
                color: null,
            };

            if (hasTemplate && template_spec.slot_options) {
                if (template_spec.slot_options) {
                    newQueue.description += '. Possible options: *"' + template_spec.slot_options.join('"*, *"') + '"*';
                }
                newQueue.slot_options = template_spec.slot_options || newQueue.slot_options;
                newQueue.slots_defined = template_spec.slots_defined || newQueue.slots_defined;
                newQueue.icon = template_spec.icon || newQueue.icon;
                newQueue.color = template_spec.color || newQueue.color;
            }

            client.logger.verbose(`creating a ${size} slot queue with a title of "${title}"`)
            let count = activeQueues.push(newQueue);

            showQueue(count-1);
        }

        /**
         *
         * @param name : string
         * @return {boolean|Object}
         */
        function getTemplate(name) {
            if (!(name in templates)) {
                message.reply(`Cant find a template called "${name}"`);
                return false;
            }
            return templates[name];
        }

        /**
         *
         * @param response : string
         * @param queue : int
         * @param slot : string
         */
        function markAs(response, queue, slot) {
            manageSlot();
            console.log(`Marking user as a "${response}" for ${slot || 'the first available slot'} in queue ${queue}`);
        }

        /**
         * Manage a slot in a given queue
         *
         * @param action : string
         * @param queue : int
         * @param slot : string
         * @param rolled : ?int
         */
        function manageSlot(action, queue, slot, rolled) {
            const selectedQueue = activeQueues[queue];
            function setSlot(confirmed, slotOverride=null) {
                activeQueues[queue].slots[slotOverride || slot] = {
                    id: message.author.id,
                    name: message.author.name,
                    confirmed: confirmed,
                    rolled: rolled,
                }
                if (rolled) {
                    activeQueues[queue].rolls[message.author.id] = {
                        name: message.author.name,
                        rolled: rolled,
                    }
                }
            }

            if (action == 'add' || action == 'maybe') {
                if (slot in activeQueues[queue].slots) {
                    let slotInQuestion = activeQueues[queue].slots[slot];
                    if (slotInQuestion.id != message.author.id) {
                        if (action == 'add' && !slotInQuestion.confirmed) {
                            message.reply(`You've taken ${slotInQuestion.name}'s place`);
                            setSlot(action == 'add');
                        } else {
                            message.reply('Someone else is already in that slot');
                        }
                        return;
                    }
                    setSlot(action == 'add');
                    if (action == 'add') message.reply('Marking you as a yes :thumbsup:')
                    else message.reply('Marking you as a maybe :thumbsup:')
                } else {
                    if (selectedQueue.slots.length < selectedQueue.size) {
                        setSlot(action == 'add');
                    } else {
                        if (action == 'add') {
                            for (const [slot, data] of selectedQueue.slots.entries()) {
                                if (!data.confirmed) {
                                    message.reply(`You've taken ${data.name}'s place`);
                                    setSlot(action == 'add', slot);
                                    return;
                                }
                            }
                        } else {
                            message.reply('There are no more slots available')
                        }
                    }
                }
            } else if (action == 'remove') {
                if (!(slot in activeQueues[queue].slots)) {
                    message.reply('No one is in that slot'); return;
                }
                let slotInQuestion = activeQueues[queue].slots[slot];
                if (slotInQuestion.id != message.author.id) {
                    message.reply('You are not in that slot'); return;
                }
                delete activeQueues[queue].slots[slot];
                message.reply('Removed');
            } else {
                client.logger.error(`Bad things happened while managing queue slots!`)
                client.logger.error(`|server: ${client.currentserver.name}|author: ${message.author.tag}|action: ${action}|queue: ${queue}|slot: ${slot}|rolled: ${rolled}|`)
                message.reply('Things have happened... And I dont know what to do about it! Needless to say, I couldnt modify the queue.');
            }
        }

        function roll() {
            const getRand = (min, max) => parseInt(Math.random() * (max - min) + min);
            const rand = getRand(1, 20);
            message.reply('You rolled a ' + rand);
            // TODO: This...
            // If > Lowest
            //   -> bump
            //
        }

        function closeQueue(id) {
            delete activeQueues[id-1];
            activeQueues = activeQueues.filter(_ => true);
            message.reply('Queue closed and removed');
        }

        function listQueues() {
            // message.channel.send('These are the active queues:');
            if (activeQueues.length) {
                let listText = '';
                activeQueues.forEach(function (queue, index) {
                    listText += `**${index+1}**) ${queue.title || '*<No Title>*'}\n`;
                });
                message.channel.send('Active queues:');
                message.channel.send(listText);
            } else {
                message.reply('There are no active queues at the moment');
            }
        }

        function showQueue(queue_id) {
            if (!activeQueues[queue_id]) {
                message.reply('That queue doesnt exist');
                return false;
            }
            let embed = createQueueEmbed(activeQueues[queue_id]);
            message.channel.send(embed);
        }

        function createQueueEmbed(queue) {
            client.logger.debug('Creating queue embed');

            let queueText = '';
            for (let i = 0; i < queue.size; i++) {
                let slot_pos = `**${i + 1}**)`;
                if (queue.slot_options.length) {
                    if (queue.slots_defined) slot_pos = `**${queue.slot_options[i]}**)`;
                    else slot_pos = '**--**';
                }
                queueText += `${slot_pos} \n`;
            }

            return new Discord.MessageEmbed()
                .setColor(queue.color || '#0099ff')
                .setTitle(queue.title)
                .setAuthor(queue.creator.name, queue.creator.icon)
                .setDescription(queue.description)
                .addField('\u200B', queueText)
                .setImage(queue.icon)
                .setTimestamp()
            ;
        }

        const subcommand = args.shift().toLowerCase();
        switch (subcommand) {
            case 'create':
                // Grab some needed default args
                let sub_or_count = args.shift().toLowerCase();
                let size = sub_or_count;
                let template = null;

                if (Number.isNaN(parseInt(sub_or_count))) {
                    switch (sub_or_count.toLowerCase()) {
                        case 'template':
                            template = getTemplate(args.shift().toLowerCase())
                            if (!template) return;
                            size = template.num_slots;
                            break;
                        default:
                            message.reply('I dont understand...');
                            return false;
                    }
                }

                // Combine the remaining unused args
                let title = args.join(' ');

                createQueue(parseInt(size), title, template);
                break;
            case 'yes':
            case 'no':
            case 'maybe':
                let queueId = 1;
                let response = null;
                const numQueues = activeQueues.length;
                if (!numQueues) {
                    // No queue
                    message.reply('There are no queues active right now');
                    return;
                } else {
                    if (args.length) {
                        if (numQueues == 1) {
                            // Exactly 1 queue: All responses are considered for the slot
                            response = args.join(' ');
                        } else {
                            // Multiple queues, check if user mentioned a queue id
                            if (+args[0] === +args[0]) { // Test if args[0] is a number
                                queueId = parseInt(args[0]);
                            } else {
                                response = args.join(' ');
                            }

                            if (!response && args.length > 1) {
                                args.shift();
                                response = args.join(' ')
                            }
                        }
                    }
                }
                markAs(subcommand, queueId, response);
                break;
            case 'roll':
                roll();
                break;
            case 'close':
                closeQueue(parseInt(args.join('')));
                break;
            case 'list':
                listQueues();
                break;
            case 'show':
                if (!args.length) {
                    message.reply('You need to specify which queue to show');
                    return false;
                }
                showQueue(parseInt(args[0])-1);
                break;
            default:
                client.logger.warn('unknown subcommand: ' + subcommand)
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

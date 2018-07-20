import { EventType } from '../utils/event';
import { Subject } from "rxjs";
import 'rxjs/add/observable/of';

/**
 * 
 * Parser is a message parser for a service. This maps inputs to outputs.
 * 
 * @export
 * @class Parser
 */
export class Parser {

    public messages: Subject<Message>;
    public joins: Subject<Chatter>;
    public leaves: Subject<Chatter>;
    public connections: Subject<Message>;
    public disconnections: Subject<Message>;

    private eventMapping: {[event: string]: Subject<any>};

    /**
     * Creates an instance of Parser.
     *
     * @param {string} name the name of the service being parsed 
     * @memberof Parser
     */
    constructor(protected name: string) {
        this.messages = new Subject<Message>();
        this.joins = new Subject<Chatter>();
        this.leaves = new Subject<Chatter>();
        this.connections = new Subject<Message>();
        this.disconnections = new Subject<Message>();

        this.eventMapping = {
            "event_message": this.messages,
            "event_join": this.joins,
            "event_leave": this.leaves,
            "event_connection": this.connections,
            "event_disconnection": this.disconnections
        }
    }

    /**
     * Push an event into the eventing system.
     * 
     * @private
     * @param {EventType} event 
     * @param {*} data 
     * @memberof Parser
     */
    public pushEvent(event: EventType, data: any) {
        let subscriber = this.eventMapping[event];
        if (subscriber === undefined) {
            return;
        }
        subscriber.next(data);
    }
}

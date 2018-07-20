import { Service } from "..";

export class Test extends Service {

    constructor(protected config: Config) {
        super("", "Test", config);
        // this.parser.set("test-connect", (message: Message) => {
        //     super.connected();
        // });
    }

    protected async onOpen(): Promise<boolean> {
        return true;
    }

    protected async onPing(): Promise<boolean> {
        return true;
    }

    public async joinChannel(channel: string): Promise<boolean> {
        return false;
    }

    public async sendMessage(channel: string, message: string): Promise<boolean> {
        return false;
    }

    protected async parseMessage(message: string): Promise<Message> {
        return {eventCode: "msg", username: "TestUser", channel: "TestChannel", text: message};
    }
}

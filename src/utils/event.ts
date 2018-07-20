export enum EventType {
    MESSAGE = "event_message",
    JOIN = "event_join",
    LEAVE = "event_leave",
    CONNECTION = "event_connection",
    DISCONNECTION = "event_disconnection"
}

export interface EventCodeMapping {
    [eventCode: string]: EventType;
}

"use strict";

const chai = require("chai");
chai.use(require("chai-as-promised"));

const baseService = require("../dist/socket/service/test").Test;

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should();

describe("Base Service", () => {
    let service;
    let parsedMessage;

    before(() => {
        service = new baseService({
            mongo: {
                url: "localhost",
                databaseName: "testing"
            },
            bot: {
                username: "ClutchBotTesting",
                token: "tokenHere",
                initialChannel: "channelHere"
            }
        });
        parsedMessage = service.parseMessage("test");
    });

    it("should have no url", () => {
        service.socketUrl.should.be.eq("");
    });

    it("should return `true` when opened", (done) => {
        service.onOpen().should.eventually.be.eq(true).notify(done);
    });

    it("should return `true` when pinged", (done) => {
        service.onPing().should.eventually.be.eq(true).notify(done);
    });

    it("should return `false` when trying to join channel", (done) => {
        service.joinChannel("TestChannel").should.eventually.be.eq(false).notify(done);
    });

    it("should return `false` when trying to send message to channel", (done) => {
        service.sendMessage("TestChannel", "Test Message").should.eventually.be.eq(false).notify(done);
    });

    describe("Message parser", () => {
        it("should have 'msg' eventCode when parsed", (done) => {
            parsedMessage.should.eventually.have.property("eventCode").and.should.eventually.eq("msg").notify(done);
        });

        it("should have 'TestUser' username when parsed", (done) => {
            parsedMessage.should.eventually.have.property("username").and.should.eventually.eq("TestUser").notify(done);
        });

        it("should have 'TestChannel' channel when parsed", (done) => {
            parsedMessage.should.eventually.have.property("channel").and.should.eventually.eq("TestChannel").notify(done);
        });

        it("should have 'test' text when parsed", (done) => {
            parsedMessage.should.eventually.have.property("text").and.should.eventually.eq("test").notify(done);
        });
    });

    describe("Parser", () => {
        it("should return 'false' when checking if connected", () => {
            service.isConnected.should.be.eq(false);
        });
        it("should return 'true' when checking if connected", () => {
            service.verifyAndParseMessage({eventCode: "test-connect", username: "", channel: "", text: ""});
            service.isConnected.should.be.eq(true);
        });
    });
});

import { wait } from "../wait";
const fetch = require('node-fetch');
const FormData = require('form-data');
const { URLSearchParams } = require("url");

let Characteristic: any;

export class SwitchAccessory {

  static switchType: string = "switch";
  static infoModel: string = "Switch";

  public switchService: any;

  log: Function;
  ip: string;
  apiKey: string;
  updateInterval: number;
  debugMsgLog: number;
  updateTimer: any;
  deviceId: string;
  switchSeq: number;

  constructor(log: Function,
    deviceId: string,
    switchSeq: number,
    ip: string,
    apiKey: string,
    updateInterval: number,
    debugMsgLog: number,
    characteristic: any
  ) {

    this.deviceId = deviceId;
    this.switchSeq = switchSeq;
    this.log = log;
    this.ip = ip;
    this.apiKey = apiKey;
    this.updateInterval = updateInterval;
    this.debugMsgLog = debugMsgLog;
    Characteristic = characteristic;

    if (this.updateInterval > 0) {
      this.switchAutoUpdate();
    }

  }

  //
  // Tasmota Switch Service
  //

  getSwitchOn = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    // let userPasswordString = ((this.user != "none") && (this.password != "none")) ? "user=" + this.user + "&password=" + this.password + "&" : "";

    // let requestString = "http://" + this.ip + "/cm?" + userPasswordString + "cmnd=Power Status";

    let url = `http://${this.ip}/api/switch`;
    const params = new URLSearchParams( {
      apiKey: this.apiKey
    })
    url+= `?${params}`;
    this.log(url);

    fetch(url, {
      method: "GET"
    }
    ).then((res: any) => res.json())
      .then((data: any) => {
        try {
          if (!data.relays || data.relays.length < this.switchSeq) {
            throw new Error("Invalid Relay Response from device");
          }
          const on = data.relays[this.switchSeq - 1] == 1 ? true : false;
          this.debugLogBool("Switch ? ", on);
          this.switchService.updateCharacteristic(
            Characteristic.On,
            on
          );

          if (this.updateInterval > 0) {
            this.switchAutoUpdate();
          }

        } catch (err) {
          this.log(`error: ${err.message}`);
        }
      }).catch((err: Error) => {
        this.log(`error: ${err.message}`);
      });
  };

  setSwitchOn = async (on: boolean) => {
    this.debugLogBool("Set switch to", on);
    let url = `http://${this.ip}/api/switch?apiKey=${this.apiKey}`;
    const form = new FormData();
    form.append('key', this.switchSeq);
    form.append('value', on == true ? 1 : 0);

    fetch(url, {
      method: "POST",
      body: form
    }).then((res: any) => res.json())
      .then(async (data: any) => {
        if (!data.relays || data.relays.length < this.switchSeq) {
          throw new Error("Invalid Relay Response from device");
        }
        const on = data.relays[this.switchSeq - 1] == 1 ? true : false;
        this.debugLogBool("Switch ? ", on);
        await wait(1);
        this.switchService.updateCharacteristic(
          Characteristic.On,
          on
        );
        if (this.updateInterval > 0) {
          this.switchAutoUpdate();
        }
      }).catch((err: Error) => {
        this.log(`error: ${err.message}`);
      });

  };

  //
  // Helper Functions
  //

  debugLogNum(msg: string, num: number) {
    if (this.debugMsgLog == 1) {
      this.log(msg, num);
    }
  }
  debugLogBool(msg: string, bool: boolean) {
    if (this.debugMsgLog == 1) {
      this.log(msg, bool);
    }
  }

  switchAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getSwitchOn();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}
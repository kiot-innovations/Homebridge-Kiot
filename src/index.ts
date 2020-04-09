import { wait } from "./util/wait";
import { md5 } from "./util/md5";
import callbackify from "./util/callbackify";
import { SwitchAccessory } from "./util/accessories/SwitchAccessory"
const pjson   = require('../package.json');

let Service: any, Characteristic: any;

export default function(homebridge: any) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-kiot", "Kiot-Home", KiotAccessory);
}

class KiotAccessory {
  // From config.
  log: Function;
  name: string;
  device: string;
  manufacturer: string;
  model: string;
  serialNumber: string
  firmwareRevision: string;
  ip: string;
  user: string;
  password: string;
  updateInterval: number;
  debugMsgLog: number;
  type: string;
  typeName: string;
  apiKey: string;
  deviceId: string;
  switchSeq : number;
  // Runtime state.
  

  // Services exposed.
  serviceToExpose: any;
  servicesToExpose : Array<any>;
  infoService:     any;

  switchAccessory: SwitchAccessory | undefined;

  constructor(log: any, config: any) {
    this.log            = log;
    this.name           = config["name"];
    this.device         = config["device"]         || "Generic";
    this.deviceId      = config["deviceId"];
    this.ip             = config["ip"];
    this.user           = config["user"]           || "none";
    this.password       = config["password"]       || "none";
    this.updateInterval = config["updateInterval"] || 0;
    this.debugMsgLog    = config["debugMsgLog"]    || 0;
    this.type           = config["type"]           || SwitchAccessory.switchType;
    this.typeName       =                             SwitchAccessory.infoModel;
    this.apiKey         = config["apiKey"]         || "";
    this.switchSeq      = config["switchSeq"]      || 1;
    /**************************
     * Kiot Switch Service *
     **************************/
    this.servicesToExpose = [];
    if (this.type == SwitchAccessory.switchType) {
      this.typeName = SwitchAccessory.infoModel;

      this.switchAccessory = new SwitchAccessory(this.log, this.deviceId, this.switchSeq, this.ip, this.apiKey, this.updateInterval, this.debugMsgLog, Characteristic);

      const switchService = new Service.Switch(
        null,
        SwitchAccessory.switchType,
      );

      switchService
        .getCharacteristic(Characteristic.On)
        .on("get", callbackify(this.switchAccessory.getSwitchOn))
        .on("set", callbackify(this.switchAccessory.setSwitchOn));

      this.servicesToExpose.push(switchService);

      this.switchAccessory.switchService = switchService;

    }

    /***************************************
     * LOGO! Accessory Information Service *
     ***************************************/

    this.manufacturer     =  config["manufacturer"]     || pjson.author.name;
    this.model            =  config["model"]            || this.typeName + " @ " + this.device;
    this.serialNumber     =  config["serialNumber"]     || md5(this.name + this.typeName);
    this.firmwareRevision =  config["firmwareRevision"] || pjson.version;
    
  }

  getServices() {

    var informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer,     this.manufacturer)
      .setCharacteristic(Characteristic.Model,            this.model)
      .setCharacteristic(Characteristic.Name,             this.name)
      .setCharacteristic(Characteristic.SerialNumber,     this.serialNumber)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmwareRevision);

    return [ informationService, ...this.servicesToExpose ];
  }

  /********************
   * Helper Functions *
   ********************/

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

}

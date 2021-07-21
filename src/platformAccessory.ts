import * as http from 'http';

import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { AmbientLightAuroraPlatform } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class AmbientLightAuroraPlatformAccessory {
    //private service: Service;
    private auroraService: Service;

    /**
     * These are just used to create a working example
     * You should implement your own code to track the state of your accessory
     */
    // private exampleStates = {
    //   On: false,
    //   Brightness: 100,
    // };

    private auroraState = {
        On: false,
        Brightness: 100,
    };

    constructor(
        private readonly platform: AmbientLightAuroraPlatform,
        private readonly accessory: PlatformAccessory,
    ) {
        this.auroraService = this.accessory.getService(this.platform.Service.Lightbulb) ||
            this.accessory.addService(this.platform.Service.Lightbulb);
        this.auroraService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

        this.auroraService.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setAuroraOn.bind(this))
            .onGet(this.getAuroraOn.bind(this));

        this.auroraService.getCharacteristic(this.platform.Characteristic.Brightness)
            .onSet(this.setAuroraBrightness.bind(this))
            .onGet(this.getAuroraBrightness.bind(this));

    }

    async ensureServiceUp(): Promise<CharacteristicValue> {
        return new Promise((accept, reject) => {
            http.get(`http://${this.accessory.context.device.ipAddress}`, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    //this.platform.log.debug(JSON.parse(data));

                    const isString = typeof data;
                    if (isString) {
                        //return true;
                        accept(true);
                        return;
                    }
                    reject(false);
                    return false;
                });

            }).on('error', (err) => {
                this.platform.log.error('Error: ', err.message);
                reject(false);
                return false;
            });
        });
    }

    async setAuroraOn(value: CharacteristicValue) {
        this.auroraState.On = value as boolean;
        this.platform.log.info('Aurora On State: ', this.auroraState.On.toString());

        const isServiceEnabled = await this.ensureServiceUp();
        if (isServiceEnabled) {
            const data = JSON.stringify({
                enabled: this.auroraState.On,
            });

            const updateConfigOptions = {
                protocol: 'http:',
                hostname: this.accessory.context.device.ipAddress,
                port: 80,
                path: '/update_config',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length,
                },
            };

            const req = http.request(updateConfigOptions, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    this.platform.log.debug(JSON.parse(data));
                    this.platform.log.debug('Set Aurora On =>', value);
                });

            }).on('error', (err) => {
                this.platform.log.error('Error: ', err.message);
            });

            req.write(data);
            req.end();
        }
    }

    async getAuroraOn(): Promise<CharacteristicValue> {
        // implement your own code to check if the device is on
        const isOn = this.auroraState.On;

        this.platform.log.debug('Get Characteristic On ->', isOn);

        // if you need to return an error to show the device as "Not Responding" in the Home app:
        // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

        return isOn;
    }

    async setAuroraBrightness(value: CharacteristicValue) {
        this.auroraState.Brightness = value as number;
        this.platform.log.info('Aurora Brightness State: ', this.auroraState.Brightness.toString());

        const isServiceEnabled = await this.ensureServiceUp();
        if (isServiceEnabled) {
            const brightness = this.auroraState.Brightness;
            let extension = 'Aurora_Ambient_AutoCrop';
            if (brightness < 20) {
                extension = 'Aurora_AudioSpectogram';
            } else if (brightness < 40) {
                extension = 'Aurora_Meteor';
            } else if (brightness < 60) {
                extension = 'Aurora_Rainbow';
            } else if (brightness < 80) {
                extension = 'Aurora_Ambient_NoCrop';
            }

            const data = JSON.stringify({
                extension_name: extension,
            });

            const updateConfigOptions = {
                protocol: 'http:',
                hostname: this.accessory.context.device.ipAddress,
                port: 80,
                path: '/update_extension',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length,
                },
            };

            const req = http.request(updateConfigOptions, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    this.platform.log.debug(JSON.parse(data));
                    this.platform.log.debug('Set Aurora Extension =>', extension);
                });

            }).on('error', (err) => {
                this.platform.log.error('Error: ', err.message);
            });

            req.write(data);
            req.end();
        }
    }

    async getAuroraBrightness(): Promise<CharacteristicValue> {
        // implement your own code to check if the device is on
        const brightness = this.auroraState.Brightness;

        this.platform.log.debug('Get Aurora Brightness ->', brightness);

        // if you need to return an error to show the device as "Not Responding" in the Home app:
        // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

        return brightness;
    }
}

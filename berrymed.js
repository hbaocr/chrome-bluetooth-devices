/**
 * 
 * [Service] Unknown: 49535343-fe7d-4ae5-8fa9-9fafd205e455
---->[Char] Unknown: 49535343-1e4d-4bd9-ba61-23c647249616 | properties:['notify']
-------->[Descriptor] Handle 15: 00002902-0000-1000-8000-00805f9b34fb | Value: b'\x00\x00' 
---->[Char] Unknown: 49535343-8841-43f4-a8d4-ecbe34729bb3 | properties:['write-without-response', 'write']
---->[Char] Vendor specific: 00005343-0000-1000-8000-00805f9b34fb | properties:['write-without-response', 'write']
---->[Char] Vendor specific: 00005344-0000-1000-8000-00805f9b34fb | properties:['read']

[Service] Device Information: 0000180a-0000-1000-8000-00805f9b34fb
---->[Char] Manufacturer Name String: 00002a29-0000-1000-8000-00805f9b34fb | properties:['read']
---->[Char] Model Number String: 00002a24-0000-1000-8000-00805f9b34fb | properties:['read']
---->[Char] Serial Number String: 00002a25-0000-1000-8000-00805f9b34fb | properties:['read']
---->[Char] Hardware Revision String: 00002a27-0000-1000-8000-00805f9b34fb | properties:['read']
---->[Char] Firmware Revision String: 00002a26-0000-1000-8000-00805f9b34fb | properties:['read']
---->[Char] Software Revision String: 00002a28-0000-1000-8000-00805f9b34fb | properties:['read']
---->[Char] System ID: 00002a23-0000-1000-8000-00805f9b34fb | properties:['read']
---->[Char] IEEE 11073-20601 Regulatory Cert. Data List: 00002a2a-0000-1000-8000-00805f9b34fb | properties:['read']
---->[Char] PnP ID: 00002a50-0000-1000-8000-00805f9b34fb | properties:['read']

def parse(packet:bytearray):
    offset = 0
    data_step=5
    packet_len=len(packet)
    while offset< packet_len:
        packet_dict = {}
        byte_1_data_container = PARSING_SCHEMA[0].parse(packet[offset+0].to_bytes(1, 'big'))
        byte_3_data_container = PARSING_SCHEMA[2].parse(packet[offset+2].to_bytes(1, 'big'))
        packet_dict['signal_strength'] = byte_1_data_container['signal_strength']
        packet_dict['has_signal'] = byte_1_data_container['has_signal']
        packet_dict['bargraph'] = byte_3_data_container['bargraph']
        packet_dict['no_finger'] = byte_3_data_container['no_finger']
        packet_dict['spo2'] = packet[offset+4]
        packet_dict['pleth'] = packet[offset+1]
        packet_dict['pulse_rate'] = packet[offset+3] | ((packet[offset+2] & 0x40) << 1)
        offset=offset+data_step
        #print(packet_dict['pleth']) #100Hz PPG
        print(f"{packet_dict['spo2']},{ packet_dict['pulse_rate']},{packet_dict['pleth']},")

 * 
 * 
 */
//https://github.com/zh2x/BCI_Protocol/blob/master/BCI%20Protocol%20V1.2.pdf
//https://googlechrome.github.io/samples/web-bluetooth/notifications.html

class BerryMed{
    constructor(name="BerryMed"){
        this.SPO2_SERVICE_UUID='49535343-fe7d-4ae5-8fa9-9fafd205e455'.toLowerCase();
        this.SPO2_CHAR_UUID = '49535343-1e4d-4bd9-ba61-23C647249616'.toLowerCase();
        this.devName=name;
    }
    getDeviceName(){
        return this.devName;
    }
    parseSpo2(arrBuffer){
        let packet_len = arrBuffer.byteLength;
        let offset=0;
        //let byteValue=arrBuffer.getUint8(offset); // get byte value at idx
        let spo2 = arrBuffer.getUint8(offset+4);
        let hr = arrBuffer.getUint8(offset+3)|((arrBuffer.getUint8(offset+2)&0x40)<<1);
        spo2=spo2>=100?'':spo2;
        hr = hr>=255?'':hr;
        return {spo2,hr};    
    }
    async startDevice(onNewIncomingData,onError){
        const SPO2_SERVICE_UUID = this.SPO2_SERVICE_UUID;
        const SPO2_CHAR_UUID = this.SPO2_CHAR_UUID;
        const devName = this.devName;
        const parseSpo2 = this.parseSpo2;
        
        try {
         
            const device = await navigator.bluetooth.requestDevice({
                optionalServices: [SPO2_SERVICE_UUID, "device_information"],
                //acceptAllDevices: true,
                filters: [{
                    name: `${devName}` /** filter by deviceName */
                  }],
            });
            // Connect to the GATT server
            // We also get the name of the Bluetooth device here
            let deviceName = device.gatt.device.name;
            console.log(deviceName);
    
            const server = await device.gatt.connect();
    
            const infoService = await server.getPrimaryService("device_information");
            const infoCharacteristics = await infoService.getCharacteristics();
    
            console.log(infoCharacteristics);
            let infoValues = [];
    
            const promise = new Promise((resolve, reject) => {
                infoCharacteristics.forEach(async (characteristic, index, array) => {
                    // Returns a buffer
                    const value = await characteristic.readValue();
                    let str = new TextDecoder().decode(value);
                    console.log(str);
                    // Convert the buffer to string
                    infoValues.push(str);
                    if (index === array.length - 1) resolve(infoValues);
                });
            });
    
            promise.then((v) => {
                //console.log(infoValues);
               // console.log(v);
               // displayDeviceInfos(infoValues)
               if(onNewIncomingData) onNewIncomingData('device_information',v);
            })
    
            // spo2
            console.log('Get SPO2 service')
            const spo2Service = await server.getPrimaryService(SPO2_SERVICE_UUID);
            const spo2Characteristic = await spo2Service.getCharacteristic(SPO2_CHAR_UUID);
            spo2Characteristic.startNotifications().then(_ => {
                console.log(`start read spo2`);
                spo2Characteristic.addEventListener('characteristicvaluechanged', (event)=>{
                    let value = event.target.value;
                    let ret = parseSpo2(value);
                    if(onNewIncomingData) onNewIncomingData('spo2Information',ret);

                });
            });
        } catch (error) {
            console.log(error);
            if(onError) onError(error);
    
        }
    }
}

/**
 * 
 * function handleNotifications(event) {
    let value = event.target.value;
    let a = [];
    // Convert raw data bytes to hex values just for the sake of showing something.
    // In the "real" world, you'd use data.getUint8, data.getUint16 or even
    // TextDecoder to process raw data bytes.
    for (let i = 0; i < value.byteLength; i++) {
        a.push('0x' + ('00' + value.getUint8(i).toString(16)).slice(-2));
    }
    console.log(a);
    spo2Val=parseSpo2(value);
    displaySPO2(spo2Val);
    //log('> ' + a.join(' '));
}
 * 
 */
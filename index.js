
const SPO2_SERVICE_UUID = '49535343-fe7d-4ae5-8fa9-9fafd205e455'.toLowerCase();
const SPO2_CHAR_UUID = '49535343-1e4d-4bd9-ba61-23C647249616'.toLowerCase();
const SPO2_CHAR_CONFIG = '0x2902'.toLowerCase();
let spo2Val = {};
window.addEventListener('load', function () {

    document.getElementById('btn_scan').addEventListener('click', onScanClick);
    document.getElementById('txt_dev_name').innerHTML = "DevName: ";
    document.getElementById('txt_firmware_ver').innerHTML = "FwVersion: ";
    document.getElementById('txt_software_ver').innerHTML = "SwVersion: ";


    document.getElementById('txt_spo2').innerHTML = "SPO2: ";
    document.getElementById('txt_hr').innerHTML = "HR: ";
    document.getElementById('txt_pi').innerHTML = " ";


})

const displayDeviceInfos = (inputArrays) => {
    document.getElementById('txt_dev_name').innerHTML = `DevName: ` + inputArrays[2].toString("utf8");
    document.getElementById('txt_firmware_ver').innerHTML = `FwVersion: ` + inputArrays[0].toString("utf8");
    document.getElementById('txt_software_ver').innerHTML = `SwVersion: ` + inputArrays[1].toString("utf8");
}

const displaySPO2 = (spo2V) => {
    document.getElementById('txt_spo2').innerHTML = "SPO2: " + spo2V.spo2 || '';
    document.getElementById('txt_hr').innerHTML = "HR: " + spo2V.hr || '';
    document.getElementById('txt_pi').innerHTML = "";
}

const onScanClick = async (e) => {
    let bleDev = new BerryMed();
    console.log(bleDev.getDeviceName());
    bleDev.startDevice(onBleIncomingData,onBleErr);
}

const onBleIncomingData = async (tag, data) => {
    if (tag == "device_information") {
        console.log('Update device information');
        displayDeviceInfos(data);
        return;
    }
    if (tag == "spo2Information") {
        displaySPO2(data);
        return;
    }
}

const onBleErr = async (err) => {
    console.log(err);
}
import { Emulator } from "./emulator";
import * as fs from "fs";
import * as path from "path";

function findRom(romPath: string): Uint8Array {
    return fs.readFileSync(path.resolve(romPath));
}
const emu: Emulator = new Emulator();
emu.load(findRom("rom/ibm_logo.ch8"));


function start(): void {
    emu.tick();

    setTimeout(start, 500);
}

start();

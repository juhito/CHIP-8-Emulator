import * as constants from "./utils/constants";
import { Screen } from "./screen";

export class Emulator {
    /*
      RAM: 
      
      CHIP-8 is designed to copy the entire game program into its own RAM space, where it can then read and written
      to as needed. It was originally sesigned to be implemented on computers with 4096 bytes (4 KB) of RAM, so
      that's how much it is allocated with.

      V and I Registers:
      
      RAM access is usually considered fairly slow (yet still much faster than reading from disc). To speed things 
      up, the CHIP-8 defines sixteen 8-bit registers which the game can use as it pleases for much faster operations.
      These are referred to as the V registers, and are usually numbered in hex from V0 to VF.

      There is also another 16-bit register known as the I Register, which is used for indexing into RAM for reads and writes.

      Stack:

      The CPU also has a small stack, which is an array of 16-bit values that the CPU can read and write to. The stack differs
      from regular RAM as the stack can only be read/written to via a FIFO principle. However, the stack is not general purpose.
      Only times the stack is allowed to be used is when you are entring or exiting a subroutine, where the stack is used to know
      where you started so you can return after the routine ends. 
     */
    private memory: Uint8Array;
    private vreg: Uint8Array;
    private ireg: number;
    private stack: Uint16Array;

    private sp: number; // Stack pointer 
    private pc: number; // Index of the current instruction, known as the "Program Counter".

    /* 
       These are two special registers that are used as timers. Delay timer is used by the system as a typical timer,
       counting down every cycle and performing some action if it hits 0. The Sound timer on the other hand, also counts
       down every clock cycle, but upon hitting 0 emits a noise. Both are 8-bit registers.
     */
    private dt: number;
    private st: number;

    private keys: Array<boolean>;

    private screen: Screen;

    private running: boolean;

    constructor() {
        this.memory = new Uint8Array(constants.ram_size);
        this.stack = new Uint16Array(constants.stack_size);

        this.vreg = new Uint8Array(constants.reg_size);
        this.ireg = 0;

        this.sp = 0;
        this.pc = 0x200;

        this.dt = 0;
        this.st = 0;

        this.keys = new Array<boolean>(constants.key_size);

        this.screen = new Screen();
        this.screen.onKeyPress(this.keys);
        // Populates the font data in the first 80 bytes of memory.
        for (let i: number = 0; i < constants.font_size; i++) {
            this.memory[i] = constants.font_set[i];
        }

        this.running = true;
    }

    // represents each clock cycle.
    public tick(): void {
        /*
          1. Fetch the instruction from RAM @ the address pointed by the PC.
          2. Decode the instruction.
          3. Execute the instruction.
          4. Increment PC and repeat.
        */
        if (this.running) {
            const op: number = this.fetch();
            this.execute(op);

            // update timers
            if (this.dt > 0) this.dt -= 1;
            if (this.st > 0) {
                if (this.st == 1) console.log("make beep sound :)");
                this.st -= 1;
            }
        }
    }

    public load(data: Uint8Array): void {
        for (let i: number = 0; i < data.length; i++) {
            this.memory[this.pc + i] = data[i];
        }
    }

    // add a way to reset without making a new object
    public reset(): void {
        this.memory = new Uint8Array(constants.ram_size);
        this.stack = new Uint16Array(constants.stack_size);

        this.vreg = new Uint8Array(constants.reg_size);
        this.ireg = 0;

        this.sp = 0;
        this.pc = 0x200;

        this.dt = 0;
        this.st = 0;

        this.keys = new Array<boolean>(constants.key_size);

        this.screen = new Screen();

        // Populates the font data in the first 80 bytes of memory.
        for (let i: number = 0; i < constants.font_size; i++) {
            this.memory[i] = constants.font_set[i];
        }
    }

    // Fetch the instruction (known as an opcode) from RAM 
    private fetch(): number {
        const first_byte: number = this.memory[this.pc];
        const second_byte: number = this.memory[this.pc + 1];

        this.pc += 2; // move forward 2 bytes

        // combine the two values
        return (first_byte << 8) | second_byte;
    }

    // Decode the opcode and do pattern matching
    private execute(opcode: number): void {

        /*
          vx is the second nibble of the first instruction.
          vy is the third nibble of the second instruction.

          For example, if we have a instruction consisting of 0x8451, we use bitwise AND
          to get rid of everything we don't need and then shift right to get the result
          we want.

          vx is in this example 0x4
          vy is in this example 0x5

          (opcode & 0x0F00) = 0x0400
          (opcode & 0x00F0) = 0x0050
          
          0x0400 >> 8 = 0x04 or 0x4
          0x0050 >> 4 = 0x05 or 0x5

          These are used to look up values in the register.
         */
        const x: number = (opcode & 0x0F00) >> 8;
        const y: number = (opcode & 0x00F0) >> 4;
        // Mask of the the first number in the instruction
        // This first number indicates what kind of instruction it is.
        switch (opcode & 0xF000) {
            case 0x0000:
                switch (opcode & 0x00FF) {
                    case 0x00E0: // clear the screen
                        this.screen = new Screen();
                        break;
                    case 0x00EE: // return from subroutine
                        this.pc = this.stack[this.sp];
                        this.sp--;
                        break;
                }
                break;
            case 0x1000: // 1NNN: jump NNN
                this.pc = (opcode & 0x0FFF);
                break;
            case 0x2000: // 2NNN: Call addr
                this.sp++;
                this.stack[this.sp] = this.pc;
                this.pc = (opcode & 0x0FFF);
                break;
            case 0x3000: // 3XNN: if vreg[x] != NN
                if (this.vreg[x] === (opcode & 0x00FF))
                    this.pc += 2;
                break;
            case 0x4000: // 4XNN: if vreg[x] == NN
                if (this.vreg[x] !== (opcode & 0x00FF))
                    this.pc += 2;
                break;
            case 0x5000: // 5XY0: if vreg[x] != vreg[y]
                if (this.vreg[x] === this.vreg[y])
                    this.pc += 2;
                break;
            case 0x6000: // 6XNN: vreg[x] = NN
                this.vreg[x] = (opcode & 0x00FF);
                break;
            case 0x7000: // 7XNN: vreg[x] += NN
                this.vreg[x] += (opcode & 0x00FF);
                break;
            case 0x8000: // 8XY0 - 8XYE
                switch (opcode & 0xF00F) {
                    case 0x8000:
                        this.vreg[x] = this.vreg[y];
                        break;
                    case 0x8001:
                        this.vreg[x] |= this.vreg[y];
                        break;
                    case 0x8002:
                        this.vreg[x] &= this.vreg[y];
                        break;
                    case 0x8003:
                        this.vreg[x] ^= this.vreg[y];
                        break;
                    case 0x8004:

                        let sum: number = (this.vreg[x] += this.vreg[y]);
                        this.vreg[0x000F] = 0;

                        if (sum > 255)
                            this.vreg[0x000F] = 1;

                        this.vreg[x] = sum;

                        break;
                    case 0x8005:
                        this.memory[0x000F] = 0;
                        if (this.vreg[x] > this.vreg[y])
                            this.memory[0x000F] = 1;

                        this.vreg[x] -= this.vreg[y];
                        break;
                    case 0x8006:
                        this.vreg[0x000F] = (this.vreg[x] & 0x1);

                        this.vreg[x] >>= 1;
                        break;
                    case 0x8007:
                        this.memory[0x000F] = 0;
                        if (this.vreg[x] < this.vreg[y])
                            this.memory[0x000F] = 1;

                        this.vreg[x] = this.vreg[y] - this.vreg[x];
                        break;
                    case 0x800E:
                        this.vreg[0x000F] = (this.vreg[x] & 0x80);
                        this.vreg[x] <<= 1;
                        break;
                }
                break;
            case 0x9000: // 9XY0: if vreg[x] == vreg[y]
                if (this.vreg[x] !== this.vreg[y])
                    this.pc += 2;
                break;
            case 0xA000: // ANNN: ireg = NNN
                this.ireg = (opcode & 0x0FFF);
                break;
            case 0xB000: // BNNN: jump to NNN + vreg[0]
                this.pc = (opcode & 0x0FFF) + this.vreg[0];
                break;
            case 0xC000: // CXNN: vreg[x] = rand & least significant byte
                this.vreg[x] = (Math.random() * 255) & (opcode & 0x00FF);
                break;
            case 0xD000: // DXYN: draw and erase pixels
                let xcoord: number = this.vreg[x];
                let ycoord: number = this.vreg[y];
                let height: number = (opcode & 0x000F);
                this.vreg[0x000F] = 0;

                for (let i: number = 0; i < height; i++) {
                    let sprite: number = this.memory[this.ireg + i];

                    for (let j: number = 0; j < 8; j++) {
                        if ((sprite & 0x80) != 0) {
                            let xx: number = (xcoord + j) % constants.screen_width; // wrap around width
                            let yy: number = (ycoord + i) % constants.screen_height; // wrap around height

                            if (this.screen.drawPixel(xx, yy))
                                this.vreg[0x000F] = 1;
                        }

                        sprite <<= 1;
                    }
                }

                break;
            case 0xE000: // EX9E: if vreg[x] key pressed
                // EXA1: if vreg[x] key not pressed
                switch (opcode & 0x00FF) {
                    case 0xE09E:
                        if (this.keys[this.vreg[x]]) this.pc += 2;
                        break;
                    case 0xE0A1:
                        if (!this.keys[this.vreg[x]]) this.pc += 2;
                        break;
                }
                break;
            case 0xF000: // FX07 - FX65
                switch (opcode & 0xF0FF) {
                    case 0xF007:
                        this.vreg[x] = this.dt;
                        break;
                    case 0xF015:
                        this.dt = this.vreg[x];
                        break;
                    case 0xF018:
                        this.st = this.vreg[x];
                        break;
                    case 0xF01E:
                        this.ireg += this.vreg[x];
                        break;
                    case 0xF00A:
                        //TODO
                        break;
                    case 0xF029:
                        this.ireg = this.vreg[x] * 5;
                        break;
                    case 0xF033:
                        this.memory[this.ireg] = this.vreg[x] / 100;

                        this.memory[this.ireg + 1] = (this.vreg[x] % 100) / 10;

                        this.memory[this.ireg + 2] = this.vreg[x] % 10;
                        break;
                    case 0xF055:
                        for (let i: number = 0; i <= x; i++)
                            this.memory[this.ireg + i] = this.vreg[i];
                        break;
                    case 0xF065:
                        for (let i: number = 0; i <= x; i++)
                            this.vreg[i] = this.memory[this.ireg + i];
                        break;
                }
                break;
            default:
                console.log("doesnt match");
                break;
        }
    }
}

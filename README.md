# CHIP-8 Emulator
CHIP-8 Emulator made in Typescript. This is my first attempt at making an emulator.

# Description
I had barely heard of CHIP-8 before starting on this project, so this will be interesting. CHIP-8 is a simple interpreted
programming language that was developed in the 70's by **Joseph Weisbecker**. It was initially used on the [COSMAC VIP](https://en.wikipedia.org/wiki/COSMAC_VIP) and
[Telmac 1800 8-bit microcomputers](https://en.wikipedia.org/wiki/Telmac_1800). CHIP-8 was mode to allow video games to be more
easily programmed for these computers, but CHIP-8 is still used today, due to its simplicity, and consequently on any platform and
its teaching of programming Binary numbers.

A virtual machine that plays these games is actually CHIP-8 interpreter, not technically an emulator, as an emulator is software
that emulates the hardware of a specific machine, and CHIP-8 programs aren't tied to any hardware in specific.

CHIP-8 uses:
* A 64 * 32 monochrome display, drawn to via sprites that are always 8px wide and between 1 and 16 pixels tall.
* Sixteen 8-bit general purpose registers referred to as V0 through VF. VF also doubles as the flag register for overflow operations.
* 16-bit program counter.
* Single 16-bit register used as pointer for memory access called the **I Register**.
* An unstandardised amount of RAM, however most emulators allocate 4 KB.
* 16-bit stack used for calling and returning from subroutines.
* 16-key keyboard input.
* Two special registers which decrease each frame and trigger upon reaching zero:
   - Delay Timer - Used for time-based game events.
   - Sound Timer - Used to trigger the audio beep.


# Installation
* TODO

# License
MIT

# Project status
I am currently developing this in my free time.

const decoder = new TextDecoder("utf-8");

const reflectRegex = /monsters reflect \d{1,}% of (?<type>.+) damage/i;

const ALARM_SOUND_FILE = new URL(import.meta.resolve("./warning.wav"));

for await (const chunk of Deno.stdin.readable) {
    const text = decoder.decode(chunk);
    // console.log("Copied text:", text);

    const result = text.match(reflectRegex);
    if (result && result.groups) {
        console.log(result);
        const soundAlert = Deno.run({
            cmd: ["play", "--volume=0.5", ALARM_SOUND_FILE.pathname],
            stderr: "piped",
            // stdin: "piped",
        });
        const notification = Deno.run({
            cmd: ["notify-send", "--urgency=critical", "--category=error", "--expire-time=5000", "REFLECT DETECTED!", `Damage type: ${result.groups.type}`],
            stderr: "piped",
            // stdin: "piped",
            // stdout: "piped",
        });

        await Promise.all([
            soundAlert.status(),
            // soundAlert.output(),
            soundAlert.stderrOutput(),
            notification.status(),
            // notification.output(),
            notification.stderrOutput(),
        ]);
    }
}

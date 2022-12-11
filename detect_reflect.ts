const decoder = new TextDecoder("utf-8");

const detectList = [
    {
        regex: /monsters reflect \d{1,}% of (?<type>.+) damage/i,
        handler: (result: RegExpMatchArray) => {
            if(!result.groups?.type) {
                return;
            }
            return {
                title: "REFLECT DETECTED!",
                body: `Damage type: ${result.groups.type}`
            }
        }
    },
    {
        regex: /cannot leech from monsters/i,
        handler: (_result: unknown) => {
            return {
                title: "CANNOT LEECH",
                body: ""
            }
        }
    }
] as const;

const ALARM_SOUND_FILE = new URL(import.meta.resolve("./warning.wav"));

async function soundAlert(notificationData: {title: string, body: string}) {
    const soundAlert = Deno.run({
        cmd: ["play", "--volume=0.5", ALARM_SOUND_FILE.pathname],
        stderr: "piped",
        // stdin: "piped",
    });
    const notification = Deno.run({
        cmd: ["notify-send", "--urgency=critical", "--category=error", "--expire-time=5000", notificationData.title, notificationData.body],
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

for await (const chunk of Deno.stdin.readable) {
    const text = decoder.decode(chunk);
    // console.log("Copied text:", text);

    for (const detect of detectList) {
        const result = text.match(detect.regex);
        if (result) {
            console.log(result);
            const notificationData = detect.handler(result);
            if (notificationData) {
                await soundAlert(notificationData);
                break;
            }
        }
    }
}

const decoder = new TextDecoder("utf-8");

type Handler = {
    regex: RegExp,
    handler: (results: RegExpMatchArray[]) => {
        title: string
        body: string
    }
};

const detectList: readonly Handler[] = [
    {
        regex: /monsters reflect \d{1,}% of (?<type>.+) damage/gi,
        handler: (result: RegExpMatchArray[]) => {
            const title = "REFLECT_DETECTED";
            const damageTypes = [];
            for (const r of result) {
                damageTypes.push(r.groups!.type);
            }
            return {
                title,
                body: `Damage type: ${damageTypes.sort().join(",")}`
            }
        }
    },
    {
        regex: /cannot leech from monsters/gi,
        handler: () => {
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
        cmd: ["play", "--volume=0.1", ALARM_SOUND_FILE.pathname],
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
        const [...result] = text.matchAll(detect.regex);
        if (result.length) {
            console.log(result);
            const notificationData = detect.handler(result);
            if (notificationData) {
                soundAlert(notificationData);
                // break;
            }
        }
    }
}

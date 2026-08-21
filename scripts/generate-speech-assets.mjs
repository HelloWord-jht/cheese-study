import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = new URL("../", import.meta.url);
const sourceFiles = ["lib/learning.ts", "lib/learning-content-m1.ts", "lib/learning-content-m2.ts"];
const outputDirectory = new URL("public/audio/instructions/", projectRoot);
const force = process.argv.includes("--force");

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} 执行失败：${result.stderr || result.stdout}`);
  }
}

function parseQuotedValue(line, field) {
  const match = line.match(new RegExp(`^\\s+${field}: ("(?:[^"\\\\]|\\\\.)*"),?$`));
  return match ? JSON.parse(match[1]) : null;
}

async function collectActivities() {
  const activities = [];
  for (const relativePath of sourceFiles) {
    const source = await readFile(new URL(relativePath, projectRoot), "utf8");
    const lines = source.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const idMatch = lines[index].match(/^    id: "([a-z0-9-]+)",$/);
      if (!idMatch) continue;
      let spokenInstruction = null;
      let speechLang = null;
      for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
        if (/^    id: "/.test(lines[cursor])) break;
        spokenInstruction ??= parseQuotedValue(lines[cursor], "spokenInstruction");
        speechLang ??= parseQuotedValue(lines[cursor], "speechLang");
        if (spokenInstruction && speechLang) break;
      }
      if (spokenInstruction && speechLang) {
        activities.push({ id: idMatch[1], spokenInstruction, speechLang });
      }
    }
  }
  return activities;
}

if (!existsSync("/usr/bin/say")) {
  throw new Error("生成语音需要 macOS 的 say 命令；已生成的 MP3 不影响 Linux 服务器构建。" );
}
if (spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status !== 0) {
  throw new Error("未找到 ffmpeg。" );
}

const activities = await collectActivities();
if (activities.length !== 90) {
  throw new Error(`应生成 90 条活动指令，实际读取到 ${activities.length} 条。`);
}

await mkdir(outputDirectory, { recursive: true });
let generated = 0;
for (const activity of activities) {
  const outputUrl = new URL(`${activity.id}.mp3`, outputDirectory);
  if (!force && existsSync(outputUrl)) continue;

  const temporaryAiff = join(tmpdir(), `cheese-${activity.id}-${process.pid}.aiff`);
  const english = activity.speechLang === "en-US";
  try {
    run("/usr/bin/say", [
      "-v",
      english ? "Samantha" : "Tingting",
      "-r",
      english ? "145" : "170",
      "-o",
      temporaryAiff,
      activity.spokenInstruction,
    ]);
    run("ffmpeg", [
      "-loglevel", "error",
      "-y",
      "-i", temporaryAiff,
      "-ac", "1",
      "-ar", "24000",
      "-codec:a", "libmp3lame",
      "-q:a", "7",
      new URL(outputUrl).pathname,
    ]);
    generated += 1;
  } finally {
    await rm(temporaryAiff, { force: true });
  }
}

console.log(`活动语音已就绪：新增 ${generated} 条，共 ${activities.length} 条，目录 ${basename(new URL(outputDirectory).pathname)}/`);

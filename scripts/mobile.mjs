import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const toolchainsRoot = path.join(projectRoot, ".toolchains");
const androidSdkRoot = path.join(toolchainsRoot, "android-sdk");
const javaHome = path.join(toolchainsRoot, "jdk-21");
const gradleHome = path.join(toolchainsRoot, "gradle-home");
const androidUserHome = path.join(toolchainsRoot, "android-user-home");
const isWindows = process.platform === "win32";
const npmCli = process.env.npm_execpath;
const capacitorCli = path.join(
  projectRoot,
  "node_modules",
  "@capacitor",
  "cli",
  "bin",
  "capacitor"
);
const gradleCommand = path.join(projectRoot, "android", isWindows ? "gradlew.bat" : "gradlew");

const command = process.argv[2] ?? "doctor";
const platform = process.argv[3];

function run(executable, args, options = {}) {
  const display = [executable, ...args].join(" ");
  console.log(`\n> ${display}`);
  const result = spawnSync(executable, args, {
    cwd: projectRoot,
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      JAVA_HOME: javaHome,
      ANDROID_HOME: androidSdkRoot,
      ANDROID_SDK_ROOT: androidSdkRoot,
      ANDROID_USER_HOME: androidUserHome,
      GRADLE_USER_HOME: gradleHome,
      PATH: [
        path.join(javaHome, "bin"),
        path.join(androidSdkRoot, "platform-tools"),
        process.env.PATH ?? ""
      ].join(path.delimiter)
    },
    ...options
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`命令执行失败，退出码 ${result.status}: ${display}`);
  }
}

function runGradle(args) {
  if (!isWindows) {
    run(gradleCommand, args);
    return;
  }
  const commandProcessor = process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe";
  run(commandProcessor, [
    "/d",
    "/c",
    `call "${gradleCommand}" ${args.join(" ")}`
  ], {
    windowsVerbatimArguments: true
  });
}

function assertAndroidToolchain() {
  const javaBinary = path.join(javaHome, "bin", isWindows ? "java.exe" : "java");
  const adbBinary = path.join(
    androidSdkRoot,
    "platform-tools",
    isWindows ? "adb.exe" : "adb"
  );
  if (!existsSync(javaBinary) || !existsSync(adbBinary)) {
    throw new Error(
      "Android 工具链尚未安装。请先在 PowerShell 运行：powershell -ExecutionPolicy Bypass -File scripts/setup-android-toolchain.ps1"
    );
  }
}

function assertReleaseSigning() {
  const required = [
    "LOGOSPRAXIS_KEYSTORE_PATH",
    "LOGOSPRAXIS_KEYSTORE_PASSWORD",
    "LOGOSPRAXIS_KEY_ALIAS",
    "LOGOSPRAXIS_KEY_PASSWORD"
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `Release 签名变量缺失：${missing.join(", ")}。请先创建上传密钥并在当前终端临时设置这些变量。`
    );
  }
}

async function normalizeIosPackagePaths() {
  const packageFile = path.join(projectRoot, "ios", "App", "CapApp-SPM", "Package.swift");
  if (!existsSync(packageFile)) return;
  const current = await readFile(packageFile, "utf8");
  const normalized = current.replace(
    /path:\s*"([^"]+)"/g,
    (_match, packagePath) => `path: "${packagePath.replaceAll("\\", "/")}"`
  );
  if (normalized !== current) await writeFile(packageFile, normalized, "utf8");
}

function doctor() {
  const checks = [
    ["Node.js", process.execPath],
    ["Web 构建目录", path.join(projectRoot, "dist")],
    ["Android 工程", path.join(projectRoot, "android")],
    ["iOS 工程", path.join(projectRoot, "ios")],
    ["JDK 21", path.join(javaHome, "bin", isWindows ? "java.exe" : "java")],
    [
      "Android SDK",
      path.join(androidSdkRoot, "platform-tools", isWindows ? "adb.exe" : "adb")
    ],
    ["Gradle Wrapper", gradleCommand]
  ];
  let missing = 0;
  console.log("LogosPraxis 原生构建环境");
  for (const [label, target] of checks) {
    const present = existsSync(target);
    if (!present) missing += 1;
    console.log(`${present ? "✓" : "✗"} ${label}: ${target}`);
  }
  console.log(
    missing
      ? `\n有 ${missing} 项尚未准备好。Android 工具链可通过项目脚本安装；iOS 构建必须在 macOS + Xcode 26 上执行。`
      : "\nAndroid 本地构建条件已满足；iOS 仍需在 macOS + Xcode 26 上签名归档。"
  );
}

async function sync(targetPlatform) {
  if (!npmCli) {
    throw new Error("无法定位 npm CLI。请通过 npm run native:sync 执行此脚本。");
  }
  run(process.execPath, [npmCli, "run", "build"]);
  const args = ["cap", "sync"];
  if (targetPlatform === "android" || targetPlatform === "ios") {
    args.push(targetPlatform);
  }
  run(process.execPath, [capacitorCli, ...args.slice(1)]);
  if (!targetPlatform || targetPlatform === "ios") {
    await normalizeIosPackagePaths();
  }
}

async function buildAndroid(task, outputPath, release = false) {
  assertAndroidToolchain();
  if (release) assertReleaseSigning();
  await sync("android");
  runGradle(["-p", "android", "--no-daemon", task]);
  console.log(`\n构建产物：${path.join(projectRoot, outputPath)}`);
}

await Promise.all([
  mkdir(gradleHome, { recursive: true }),
  mkdir(androidUserHome, { recursive: true })
]);

try {
  switch (command) {
    case "doctor":
      doctor();
      break;
    case "sync":
      await sync(platform);
      break;
    case "android-debug":
      await buildAndroid("assembleDebug", "android/app/build/outputs/apk/debug/app-debug.apk");
      break;
    case "android-release-apk":
      await buildAndroid(
        "assembleRelease",
        "android/app/build/outputs/apk/release/app-release.apk",
        true
      );
      break;
    case "android-release-aab":
      await buildAndroid(
        "bundleRelease",
        "android/app/build/outputs/bundle/release/app-release.aab",
        true
      );
      break;
    default:
      throw new Error(`未知命令：${command}`);
  }
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

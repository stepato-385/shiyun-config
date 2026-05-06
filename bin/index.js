#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync, spawn } = require('child_process');

// ============================================================
//  shiyun-config - Claude Code 一键安装配置工具
//  中转地址: https://api.nuoda.vip
// ============================================================

const BASE_URL = 'https://api.nuoda.vip';
const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');
const CLAUDE_PACKAGE = '@anthropic-ai/claude-code';

// 终端颜色
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  white: '\x1b[37m',
};

function print(msg) { console.log(msg); }
function printLine() { print(c.dim + '-'.repeat(50) + c.reset); }

function printHeader() {
  print('');
  printLine();
  print(c.bold + '  shiyun-config - Claude Code 一键安装配置工具' + c.reset);
  print(c.dim + '  中转地址: ' + BASE_URL + c.reset);
  printLine();
  print('');
}

function printOK(msg) { print(c.green + '  [OK] ' + c.reset + msg); }
function printErr(msg) { print(c.red + '  [ERROR] ' + c.reset + msg); }
function printInfo(msg) { print(c.cyan + '  [INFO] ' + c.reset + msg); }
function printWait(msg) { process.stdout.write(c.yellow + '  [WAIT] ' + c.reset + msg); }

// 检查命令是否存在
function commandExists(cmd) {
  try {
    if (os.platform() === 'win32') {
      execSync(`where ${cmd}`, { stdio: 'pipe' });
    } else {
      execSync(`which ${cmd}`, { stdio: 'pipe' });
    }
    return true;
  } catch (e) {
    return false;
  }
}

// 检查 npm 包是否已全局安装
function isPackageInstalled(pkg) {
  try {
    const result = execSync(`npm list -g ${pkg} --depth=0`, { stdio: 'pipe', encoding: 'utf8' });
    return result.includes(pkg);
  } catch (e) {
    return false;
  }
}

// 安装 Claude Code
function installClaudeCode() {
  printInfo('正在安装 Claude Code，请稍候...');
  print(c.dim + '  (首次安装可能需要 1-3 分钟)' + c.reset);
  print('');

  try {
    execSync(`npm install -g ${CLAUDE_PACKAGE}`, {
      stdio: 'inherit',
      env: { ...process.env },
    });
    print('');
    printOK('Claude Code 安装成功');
    return true;
  } catch (e) {
    print('');
    printErr('Claude Code 安装失败');
    printInfo('请尝试手动安装: npm install -g ' + CLAUDE_PACKAGE);
    if (os.platform() !== 'win32') {
      printInfo('如果权限不足，请使用: sudo npm install -g ' + CLAUDE_PACKAGE);
    }
    return false;
  }
}

// 读取现有配置
function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    }
  } catch (e) {}
  return {};
}

// 写入配置
function writeSettings(settings) {
  if (!fs.existsSync(CLAUDE_DIR)) {
    fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  }
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
}

// 遮蔽 Key
function maskKey(key) {
  if (!key || key.length < 8) return '***';
  return key.substring(0, 6) + '...' + key.substring(key.length - 4);
}

// 验证 Key
function validateKey(key) {
  return key && key.length >= 10;
}

// 创建 readline
function createRL() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(rl, question) {
  return new Promise((r) => rl.question(question, (a) => r(a.trim())));
}

// 应用配置
function applyConfig(apiKey) {
  try {
    const settings = readSettings();
    if (!settings.env) settings.env = {};
    settings.env.ANTHROPIC_BASE_URL = BASE_URL;
    settings.env.ANTHROPIC_API_KEY = apiKey;
    writeSettings(settings);
    return true;
  } catch (e) {
    printErr('配置写入失败: ' + e.message);
    return false;
  }
}

// 主流程
async function main() {
  printHeader();

  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    print('  用法:');
    print('    shiyun-config              交互式安装并配置');
    print('    shiyun-config --key <KEY>  直接设置 API Key');
    print('    shiyun-config --status     查看当前配置状态');
    print('    shiyun-config --reset      重置配置');
    print('');
    process.exit(0);
  }

  if (args.includes('--status')) {
    showStatus();
    process.exit(0);
  }

  if (args.includes('--reset')) {
    resetConfig();
    process.exit(0);
  }

  // === 第一步：检查并安装 Claude Code ===
  printInfo('第一步: 检查 Claude Code 安装状态...');
  print('');

  if (isPackageInstalled(CLAUDE_PACKAGE)) {
    printOK('Claude Code 已安装');
    // 获取版本
    try {
      const ver = execSync('claude --version', { stdio: 'pipe', encoding: 'utf8' }).trim();
      print(c.dim + '  版本: ' + ver + c.reset);
    } catch (e) {}
  } else {
    printInfo('未检测到 Claude Code，开始自动安装...');
    print('');
    const installed = installClaudeCode();
    if (!installed) {
      process.exit(1);
    }
  }

  print('');

  // === 第二步：配置 API Key ===
  printInfo('第二步: 配置 API 连接...');
  print('');

  let apiKey = '';

  // 检查是否通过参数传入
  const keyIndex = args.indexOf('--key');
  if (keyIndex !== -1 && args[keyIndex + 1]) {
    apiKey = args[keyIndex + 1];
  }

  if (!validateKey(apiKey)) {
    const rl = createRL();
    while (!validateKey(apiKey)) {
      apiKey = await ask(rl, c.white + '  请输入您的 API Key: ' + c.reset);
      if (!validateKey(apiKey)) {
        printErr('Key 格式不正确，请重新输入');
      }
    }
    rl.close();
  }

  // 写入配置
  if (!applyConfig(apiKey)) {
    process.exit(1);
  }

  // === 完成 ===
  print('');
  printLine();
  print(c.bold + c.green + '  配置完成!' + c.reset);
  printLine();
  print('  API 地址: ' + c.cyan + BASE_URL + c.reset);
  print('  API Key:  ' + c.cyan + maskKey(apiKey) + c.reset);
  print('  配置文件: ' + c.dim + SETTINGS_FILE + c.reset);
  printLine();
  print('');
  printInfo('现在可以启动 Claude Code:');
  print('');
  print('  ' + c.bold + 'claude' + c.reset);
  print('');
}

// 显示状态
function showStatus() {
  const settings = readSettings();
  const installed = isPackageInstalled(CLAUDE_PACKAGE);

  print('  当前状态:');
  print('');

  if (installed) {
    printOK('Claude Code: 已安装');
    try {
      const ver = execSync('claude --version', { stdio: 'pipe', encoding: 'utf8' }).trim();
      print(c.dim + '       版本: ' + ver + c.reset);
    } catch (e) {}
  } else {
    printInfo('Claude Code: 未安装');
  }

  if (settings.env && settings.env.ANTHROPIC_BASE_URL) {
    printOK('API 地址: ' + settings.env.ANTHROPIC_BASE_URL);
  } else {
    printInfo('API 地址: 未配置');
  }

  if (settings.env && settings.env.ANTHROPIC_API_KEY) {
    printOK('API Key:  ' + maskKey(settings.env.ANTHROPIC_API_KEY));
  } else {
    printInfo('API Key:  未配置');
  }

  print('');
}

// 重置配置
function resetConfig() {
  try {
    const settings = readSettings();
    if (settings.env) {
      delete settings.env.ANTHROPIC_BASE_URL;
      delete settings.env.ANTHROPIC_API_KEY;
      if (Object.keys(settings.env).length === 0) delete settings.env;
    }
    writeSettings(settings);
    printOK('配置已重置');
    print('');
  } catch (e) {
    printErr('重置失败: ' + e.message);
    process.exit(1);
  }
}

main().catch((e) => {
  printErr('运行出错: ' + e.message);
  process.exit(1);
});

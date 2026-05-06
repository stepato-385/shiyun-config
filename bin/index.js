#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// ============================================================
//  shiyun-config - Claude Code 一键配置工具
//  中转地址: https://api.nuoda.vip
// ============================================================

const BASE_URL = 'https://api.nuoda.vip';
const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');

// 终端颜色
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  white: '\x1b[37m',
};

function print(msg) {
  console.log(msg);
}

function printLine() {
  print(colors.dim + '─'.repeat(50) + colors.reset);
}

function printHeader() {
  print('');
  printLine();
  print(colors.bold + '  shiyun-config - Claude Code 配置工具' + colors.reset);
  print(colors.dim + '  中转地址: ' + BASE_URL + colors.reset);
  printLine();
  print('');
}

function printSuccess(msg) {
  print(colors.green + '  [OK] ' + colors.reset + msg);
}

function printError(msg) {
  print(colors.red + '  [ERROR] ' + colors.reset + msg);
}

function printInfo(msg) {
  print(colors.cyan + '  [INFO] ' + colors.reset + msg);
}

// 读取现有配置
function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    // 文件不存在或解析失败，返回空对象
  }
  return {};
}

// 写入配置
function writeSettings(settings) {
  // 确保目录存在
  if (!fs.existsSync(CLAUDE_DIR)) {
    fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  }
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
}

// 创建 readline 接口
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// 提问
function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// 验证 API Key 格式
function validateApiKey(key) {
  if (!key || key.length < 10) {
    return false;
  }
  return true;
}

// 主流程
async function main() {
  printHeader();

  // 检查是否带参数运行
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    print('  用法:');
    print('    shiyun-config              交互式配置');
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

  // 直接传入 key
  const keyIndex = args.indexOf('--key');
  if (keyIndex !== -1 && args[keyIndex + 1]) {
    const apiKey = args[keyIndex + 1];
    if (!validateApiKey(apiKey)) {
      printError('API Key 格式无效，请检查后重试');
      process.exit(1);
    }
    applyConfig(apiKey);
    process.exit(0);
  }

  // 交互式配置
  const rl = createInterface();

  printInfo('本工具将自动配置 Claude Code 连接到中转 API');
  print('');

  let apiKey = '';

  while (!validateApiKey(apiKey)) {
    apiKey = await ask(rl, colors.white + '  请输入您的 API Key: ' + colors.reset);
    if (!validateApiKey(apiKey)) {
      printError('API Key 不能为空且长度不能少于 10 位，请重新输入');
    }
  }

  print('');
  applyConfig(apiKey);

  rl.close();
}

// 应用配置
function applyConfig(apiKey) {
  try {
    const settings = readSettings();

    // 确保 env 字段存在
    if (!settings.env) {
      settings.env = {};
    }

    // 设置中转地址和 API Key
    settings.env.ANTHROPIC_BASE_URL = BASE_URL;
    settings.env.ANTHROPIC_API_KEY = apiKey;

    // 写入配置文件
    writeSettings(settings);

    printSuccess('配置写入成功');
    print('');
    printLine();
    print(colors.bold + '  配置详情:' + colors.reset);
    print('  API 地址: ' + colors.cyan + BASE_URL + colors.reset);
    print('  API Key:  ' + colors.cyan + maskKey(apiKey) + colors.reset);
    print('  配置文件: ' + colors.dim + SETTINGS_FILE + colors.reset);
    printLine();
    print('');
    printInfo('配置完成，请重启 Claude Code 使配置生效');
    print('  启动命令: ' + colors.bold + 'claude' + colors.reset);
    print('');
  } catch (e) {
    printError('配置写入失败: ' + e.message);
    print('');
    printInfo('请检查目录权限: ' + CLAUDE_DIR);
    process.exit(1);
  }
}

// 显示状态
function showStatus() {
  const settings = readSettings();
  print('  当前配置状态:');
  print('');

  if (settings.env && settings.env.ANTHROPIC_BASE_URL) {
    printSuccess('API 地址: ' + settings.env.ANTHROPIC_BASE_URL);
  } else {
    printInfo('API 地址: 未配置（使用默认）');
  }

  if (settings.env && settings.env.ANTHROPIC_API_KEY) {
    printSuccess('API Key:  ' + maskKey(settings.env.ANTHROPIC_API_KEY));
  } else {
    printInfo('API Key:  未配置');
  }

  print('  配置文件: ' + colors.dim + SETTINGS_FILE + colors.reset);
  print('');
}

// 重置配置
function resetConfig() {
  try {
    const settings = readSettings();

    if (settings.env) {
      delete settings.env.ANTHROPIC_BASE_URL;
      delete settings.env.ANTHROPIC_API_KEY;

      // 如果 env 为空则删除
      if (Object.keys(settings.env).length === 0) {
        delete settings.env;
      }
    }

    writeSettings(settings);
    printSuccess('配置已重置，Claude Code 将使用默认设置');
    print('');
  } catch (e) {
    printError('重置失败: ' + e.message);
    process.exit(1);
  }
}

// 遮蔽 Key 显示
function maskKey(key) {
  if (!key || key.length < 8) return '***';
  return key.substring(0, 6) + '...' + key.substring(key.length - 4);
}

// 运行
main().catch((e) => {
  printError('运行出错: ' + e.message);
  process.exit(1);
});

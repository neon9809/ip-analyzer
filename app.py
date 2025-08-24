#!/usr/bin/env python3
"""
IP地址安全分析Web应用
支持批量IP分析，集成AbuseIPDB API
"""

from flask import Flask, render_template, request, jsonify, send_file
import requests
import json
import time
import socket
import csv
import pandas as pd
from typing import Dict, List, Optional
import logging
import os
import io
from datetime import datetime
import threading
import uuid

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = 'ip_analyzer_secret_key_2024'

# 全局变量存储分析任务
analysis_tasks = {}

class IPAnalyzer:
    def __init__(self, abuseipdb_api_key: Optional[str] = None):
        """初始化IP分析器"""
        self.ipinfo_base_url = "https://ipinfo.io"
        self.abuseipdb_base_url = "https://api.abuseipdb.com/api/v2"
        self.abuseipdb_api_key = abuseipdb_api_key
        
        # 请求会话
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'IP-Security-Analyzer/1.0'
        })
        
        # AbuseIPDB API headers
        if self.abuseipdb_api_key:
            self.abuseipdb_headers = {
                'Key': self.abuseipdb_api_key,
                'Accept': 'application/json'
            }
        else:
            self.abuseipdb_headers = None
        
        # 请求间隔
        self.request_delay = 1.0
    
    def get_dns_ptr(self, ip: str) -> Optional[str]:
        """获取IP的DNS PTR记录"""
        try:
            hostname = socket.gethostbyaddr(ip)[0]
            return hostname
        except:
            return None
    
    def get_ipinfo_data(self, ip: str) -> Dict:
        """从IPinfo获取IP信息"""
        try:
            url = f"{self.ipinfo_base_url}/{ip}/json"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'country': data.get('country', ''),
                    'region': data.get('region', ''),
                    'city': data.get('city', ''),
                    'location': data.get('loc', ''),
                    'timezone': data.get('timezone', ''),
                    'postal': data.get('postal', ''),
                    'org': data.get('org', ''),
                    'asn': data.get('org', '').split(' ')[0] if data.get('org') else '',
                    'isp': data.get('org', '')
                }
            return {}
        except Exception as e:
            logger.error(f"IPinfo查询失败 for IP {ip}: {e}")
            return {}
    
    def get_abuseipdb_data(self, ip: str) -> Dict:
        """从AbuseIPDB获取恶意IP报告信息"""
        if not self.abuseipdb_headers:
            return {
                'abuse_confidence': 'API密钥未配置',
                'usage_type': 'N/A',
                'total_reports': 'N/A',
                'last_reported': 'N/A',
                'is_whitelisted': 'N/A'
            }
        
        try:
            url = f"{self.abuseipdb_base_url}/check"
            params = {
                'ipAddress': ip,
                'maxAgeInDays': 90,
                'verbose': ''
            }
            
            response = self.session.get(
                url, 
                params=params, 
                headers=self.abuseipdb_headers, 
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json().get('data', {})
                return {
                    'abuse_confidence': f"{data.get('abuseConfidencePercentage', 0)}%",
                    'usage_type': data.get('usageType', 'N/A'),
                    'total_reports': data.get('totalReports', 0),
                    'last_reported': data.get('lastReportedAt', 'N/A'),
                    'is_whitelisted': data.get('isWhitelisted', False),
                    'country_match': data.get('countryMatch', True)
                }
            elif response.status_code == 429:
                return {
                    'abuse_confidence': 'API限制',
                    'usage_type': 'N/A',
                    'total_reports': 'N/A',
                    'last_reported': 'N/A',
                    'is_whitelisted': 'N/A'
                }
            else:
                return {
                    'abuse_confidence': f'API错误({response.status_code})',
                    'usage_type': 'N/A',
                    'total_reports': 'N/A',
                    'last_reported': 'N/A',
                    'is_whitelisted': 'N/A'
                }
        except Exception as e:
            logger.error(f"AbuseIPDB查询失败 for IP {ip}: {e}")
            return {
                'abuse_confidence': f'查询失败',
                'usage_type': 'N/A',
                'total_reports': 'N/A',
                'last_reported': 'N/A',
                'is_whitelisted': 'N/A'
            }
    
    def analyze_ip_risk(self, ip_data: Dict) -> Dict:
        """分析IP风险等级"""
        risk_score = 0
        risk_factors = []
        
        # 基于AbuseIPDB置信度评分
        abuse_confidence = ip_data.get('abuse_confidence', '0%')
        if isinstance(abuse_confidence, str) and abuse_confidence.endswith('%'):
            try:
                confidence = int(abuse_confidence.replace('%', ''))
                if confidence >= 75:
                    risk_score += 50
                    risk_factors.append(f"高恶意置信度({confidence}%)")
                elif confidence >= 25:
                    risk_score += 25
                    risk_factors.append(f"中等恶意置信度({confidence}%)")
                elif confidence > 0:
                    risk_score += 10
                    risk_factors.append(f"低恶意置信度({confidence}%)")
            except ValueError:
                pass
        
        # 基于报告数量
        total_reports = ip_data.get('total_reports', 0)
        if isinstance(total_reports, int) and total_reports > 0:
            if total_reports >= 10:
                risk_score += 20
                risk_factors.append(f"多次举报({total_reports}次)")
            elif total_reports >= 5:
                risk_score += 10
                risk_factors.append(f"举报记录({total_reports}次)")
        
        # 确定风险等级
        if risk_score >= 50:
            risk_level = "高风险"
            risk_color = "danger"
        elif risk_score >= 25:
            risk_level = "中风险"
            risk_color = "warning"
        elif risk_score >= 10:
            risk_level = "低风险"
            risk_color = "info"
        else:
            risk_level = "正常"
            risk_color = "success"
        
        return {
            'risk_level': risk_level,
            'risk_score': risk_score,
            'risk_color': risk_color,
            'risk_factors': '; '.join(risk_factors) if risk_factors else '无'
        }
    
    def analyze_ip(self, ip: str) -> Dict:
        """分析单个IP地址"""
        result = {
            'ip': ip,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # 获取DNS PTR记录
        result['dns_ptr'] = self.get_dns_ptr(ip)
        
        # 获取IPinfo数据
        ipinfo_data = self.get_ipinfo_data(ip)
        result.update(ipinfo_data)
        
        # 获取AbuseIPDB数据
        abuse_data = self.get_abuseipdb_data(ip)
        result.update(abuse_data)
        
        # 分析风险等级
        risk_analysis = self.analyze_ip_risk(result)
        result.update(risk_analysis)
        
        time.sleep(self.request_delay)
        
        return result

def parse_and_validate_ips(ip_text: str) -> List[str]:
    """解析和验证IP地址列表，支持IPv4和IPv6"""
    import ipaddress
    import re
    
    ip_list = []
    
    # 预处理：统一分隔符
    processed_text = re.sub(r'[,;|]', ' ', ip_text)  # 替换分隔符为空格
    processed_text = re.sub(r'\s+', ' ', processed_text)  # 合并多个空格
    
    # 按行和空格分割
    for line in processed_text.split('\n'):
        line = line.strip()
        if line:
            for ip_str in line.split():
                ip_str = ip_str.strip()
                if ip_str and is_valid_ip(ip_str):
                    ip_list.append(ip_str)
    
    # 去重并保持顺序
    seen = set()
    unique_ips = []
    for ip in ip_list:
        if ip not in seen:
            seen.add(ip)
            unique_ips.append(ip)
    
    return unique_ips

def is_valid_ip(ip_str: str) -> bool:
    """验证IP地址是否有效（支持IPv4和IPv6）"""
    import ipaddress
    try:
        ipaddress.ip_address(ip_str)
        return True
    except ValueError:
        return False

def get_ip_version(ip_str: str) -> str:
    """获取IP地址版本"""
    import ipaddress
    try:
        ip_obj = ipaddress.ip_address(ip_str)
        return f"IPv{ip_obj.version}"
    except ValueError:
        return "Invalid"

def analyze_ips_background(task_id: str, ip_list: List[str], api_key: str):
    """后台分析IP地址"""
    try:
        analyzer = IPAnalyzer(abuseipdb_api_key=api_key)
        results = []
        total_ips = len(ip_list)
        
        analysis_tasks[task_id]['status'] = 'running'
        analysis_tasks[task_id]['total'] = total_ips
        analysis_tasks[task_id]['completed'] = 0
        
        for i, ip in enumerate(ip_list):
            if analysis_tasks[task_id]['status'] == 'cancelled':
                break
                
            try:
                result = analyzer.analyze_ip(ip.strip())
                results.append(result)
                analysis_tasks[task_id]['completed'] = i + 1
                analysis_tasks[task_id]['current_ip'] = ip
            except Exception as e:
                logger.error(f"分析IP {ip} 失败: {e}")
                results.append({
                    'ip': ip,
                    'error': str(e),
                    'risk_level': '未知',
                    'risk_color': 'secondary'
                })
        
        analysis_tasks[task_id]['status'] = 'completed'
        analysis_tasks[task_id]['results'] = results
        analysis_tasks[task_id]['completed_at'] = datetime.now().isoformat()
        
    except Exception as e:
        logger.error(f"后台分析任务失败: {e}")
        analysis_tasks[task_id]['status'] = 'error'
        analysis_tasks[task_id]['error'] = str(e)

@app.route('/')
def index():
    """主页"""
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    """开始分析IP地址"""
    data = request.get_json()
    ip_text = data.get('ips', '').strip()
    api_key = data.get('api_key', '').strip()
    
    if not ip_text:
        return jsonify({'error': '请输入IP地址'}), 400
    
    # 使用增强的IP解析函数
    ip_list = parse_and_validate_ips(ip_text)
    
    if not ip_list:
        return jsonify({'error': '未找到有效的IP地址（支持IPv4和IPv6）'}), 400
    
    # 创建分析任务
    task_id = str(uuid.uuid4())
    analysis_tasks[task_id] = {
        'status': 'pending',
        'created_at': datetime.now().isoformat(),
        'ip_count': len(ip_list),
        'ip_types': {
            'ipv4': len([ip for ip in ip_list if ':' not in ip]),
            'ipv6': len([ip for ip in ip_list if ':' in ip])
        }
    }
    
    # 启动后台分析
    thread = threading.Thread(
        target=analyze_ips_background,
        args=(task_id, ip_list, api_key)
    )
    thread.daemon = True
    thread.start()
    
    return jsonify({'task_id': task_id})

@app.route('/status/<task_id>')
def get_status(task_id):
    """获取分析状态"""
    if task_id not in analysis_tasks:
        return jsonify({'error': '任务不存在'}), 404
    
    task = analysis_tasks[task_id]
    return jsonify(task)

@app.route('/results/<task_id>')
def get_results(task_id):
    """获取分析结果"""
    if task_id not in analysis_tasks:
        return jsonify({'error': '任务不存在'}), 404
    
    task = analysis_tasks[task_id]
    if task['status'] != 'completed':
        return jsonify({'error': '分析未完成'}), 400
    
    return jsonify(task['results'])

@app.route('/download/<task_id>')
def download_results(task_id):
    """下载分析结果"""
    if task_id not in analysis_tasks:
        return jsonify({'error': '任务不存在'}), 404
    
    task = analysis_tasks[task_id]
    if task['status'] != 'completed':
        return jsonify({'error': '分析未完成'}), 400
    
    # 创建CSV文件
    output = io.StringIO()
    if task['results']:
        fieldnames = task['results'][0].keys()
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(task['results'])
    
    # 创建文件响应
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'ip_analysis_{task_id[:8]}.csv'
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)


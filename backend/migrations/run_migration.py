"""
数据库完整迁移执行脚本
使用方法：python -m backend.migrations.run_migration

功能：
1. 备份现有数据库（如果存在）
2. 删除旧表（如果存在）
3. 执行完整建表脚本
4. 验证表结构
"""

import sqlite3
import os
import shutil
from datetime import datetime

# 路径配置
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "test.db")
SQL_PATH = os.path.join(os.path.dirname(__file__), "complete_schema.sql")

def backup_database():
    """备份现有数据库"""
    if not os.path.exists(DB_PATH):
        print("数据库文件不存在，无需备份。")
        return None
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(BASE_DIR, f"test_backup_{timestamp}.db")
    shutil.copy2(DB_PATH, backup_path)
    print(f"✓ 数据库已备份到: {backup_path}")
    return backup_path

def execute_migration():
    """执行迁移脚本"""
    
    print("=" * 60)
    print("MeoWise 数据库迁移工具")
    print("=" * 60)
    print(f"数据库文件: {DB_PATH}")
    print(f"迁移脚本: {SQL_PATH}")
    print()
    
    # 检查 SQL 文件是否存在
    if not os.path.exists(SQL_PATH):
        print(f"✗ 迁移脚本不存在: {SQL_PATH}")
        return False
    
    # 备份数据库
    print("步骤 1: 备份数据库")
    backup_path = backup_database()
    print()
    
    # 连接数据库
    print("步骤 2: 执行迁移")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # 启用外键约束
        cursor.execute("PRAGMA foreign_keys = ON")
        
        # 读取并执行 SQL 脚本
        with open(SQL_PATH, 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        # 分割并执行每个语句（按分号分割）
        statements = [s.strip() for s in sql_script.split(';') if s.strip() and not s.strip().startswith('--')]
        
        executed = 0
        skipped = 0
        errors = 0
        
        for statement in statements:
            # 跳过纯注释
            if statement.startswith('--'):
                continue
            
            try:
                cursor.execute(statement)
                executed += 1
            except sqlite3.OperationalError as e:
                if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                    skipped += 1
                    print(f"  跳过（已存在）: {statement[:60]}...")
                else:
                    errors += 1
                    print(f"  错误: {e}")
                    print(f"  SQL: {statement[:100]}...")
            except Exception as e:
                errors += 1
                print(f"  未知错误: {e}")
        
        conn.commit()
        
        print()
        print(f"执行统计: 成功 {executed}, 跳过 {skipped}, 错误 {errors}")
        
    except Exception as e:
        conn.rollback()
        print(f"\n✗ 迁移失败: {e}")
        return False
    finally:
        conn.close()
    
    return True

def verify_tables():
    """验证表结构"""
    print("\n步骤 3: 验证表结构")
    
    if not os.path.exists(DB_PATH):
        print("✗ 数据库文件不存在")
        return False
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 获取所有表
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [row[0] for row in cursor.fetchall()]
    
    expected_tables = ['users', 'cats', 'devices', 'feeding_plans', 'feedings', 'eatings']
    
    print(f"数据库表: {tables}")
    print()
    
    all_exist = True
    for table in expected_tables:
        if table in tables:
            # 获取表的列信息
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [row[1] for row in cursor.fetchall()]
            print(f"✓ {table}: {len(columns)} 列")
            print(f"  列: {', '.join(columns)}")
        else:
            print(f"✗ {table}: 表不存在")
            all_exist = False
        print()
    
    conn.close()
    
    if all_exist:
        print("✓ 所有表结构验证通过！")
    else:
        print("✗ 部分表缺失，请检查迁移日志")
    
    return all_exist

def main():
    """主函数"""
    try:
        # 执行迁移
        success = execute_migration()
        
        if success:
            # 验证表结构
            verify_tables()
            
            print()
            print("=" * 60)
            print("迁移完成！")
            print("=" * 60)
            print()
            print("下一步：")
            print("1. 重启后端服务: uvicorn backend.main:app --reload")
            print("2. 访问 http://localhost:8000/docs 查看 API 文档")
        
    except Exception as e:
        print(f"\n迁移过程中发生错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

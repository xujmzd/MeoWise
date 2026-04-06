import random
from datetime import datetime, timedelta

def generate_feedings_sql(user_id: int, device_ids: list[int], num_records: int):
    sql_statements = []
    now = datetime(2026, 3, 30, 8, 0, 0)  # 起始时间
    for i in range(num_records):
        device_id = random.choice(device_ids)
        feeding_time = now + timedelta(minutes=random.randint(0, 60*24*7))  # 一周内随机时间
        amount_g = random.randint(15, 50)  # 随机克数
        type_ = random.choice(["manual", "scheduled"])
        sql = (
            f"INSERT INTO feedings (user_id, device_id, feeding_time, amount_g, type) "
            f"VALUES ({user_id}, {device_id}, '{feeding_time.strftime('%Y-%m-%d %H:%M:%S')}', {amount_g}, '{type_}');"
        )
        sql_statements.append(sql)
    return sql_statements

def generate_eatings_sql(user_id: int, device_ids: list[int], cat_ids: list[int], num_records: int):
    sql_statements = []
    now = datetime(2026, 3, 30, 8, 0, 0)
    for i in range(num_records):
        device_id = random.choice(device_ids)
        cat_id = random.choice(cat_ids)
        start_time = now + timedelta(minutes=random.randint(0, 60*24*7))
        duration = random.randint(5, 20)  # 进食时长（分钟）
        end_time = start_time + timedelta(minutes=duration)
        eaten_g = random.randint(10, 40)
        sql = (
            f"INSERT INTO eatings (user_id, device_id, cat_id, start_time, end_time, eaten_g) "
            f"VALUES ({user_id}, {device_id}, {cat_id}, '{start_time.strftime('%Y-%m-%d %H:%M:%S')}', "
            f"'{end_time.strftime('%Y-%m-%d %H:%M:%S')}', {eaten_g});"
        )
        sql_statements.append(sql)
    return sql_statements

if __name__ == "__main__":
    user_id = 1
    device_ids = [1, 2]   # 可指定设备范围
    cat_ids = [1, 2]      # 可指定猫咪范围
    num_feedings = 50     # 生成喂食记录条数
    num_eatings = 50      # 生成进食记录条数

    feedings_sql = generate_feedings_sql(user_id, device_ids, num_feedings)
    eatings_sql = generate_eatings_sql(user_id, device_ids, cat_ids, num_eatings)

    print("-- Feedings SQL")
    print("\n".join(feedings_sql))
    print("\n-- Eatings SQL")
    print("\n".join(eatings_sql))

from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def run():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['learnvault']
    n = await db['content'].count_documents({})
    u = await db['users'].count_documents({})
    print(f'Content: {n}, Users: {u}')
    
    # Check if there are any graph nodes
    gn = await db['graph_nodes'].count_documents({})
    print(f'Graph Nodes: {gn}')
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(run())

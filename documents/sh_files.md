Certainly! Here’s a description of typical `.sh` files you might find in a dockerized project like yours:

---

## Shell Script (.sh) File Descriptions

### build.sh
Builds all Docker images for the project.  
**Example:**
```bash
#!/bin/bash
docker-compose build
```
**Usage:**  
```bash
./build.sh
```

---

### `start.sh`
Starts all containers using docker-compose.  
**Example:**
```bash
#!/bin/bash
docker-compose up -d
```
**Usage:**  
```bash
./start.sh
```

---

### `stop.sh`
Stops and removes all running containers.  
**Example:**
```bash
#!/bin/bash
docker-compose down
```
**Usage:**  
```bash
./stop.sh
```

---

### `logs.sh`
Tails logs for all services, useful for debugging.  
**Example:**
```bash
#!/bin/bash
docker-compose logs -f
```
**Usage:**  
```bash
./logs.sh
```

---

### `test.sh`
Runs backend unit/integration tests inside the appropriate container.  
**Example:**
```bash
#!/bin/bash
docker-compose exec whisper_api pytest
```
**Usage:**  
```bash
./test.sh
```

---

### `restart.sh`
Restarts all containers (optional, if present).  
**Example:**
```bash
#!/bin/bash
docker-compose restart
```
**Usage:**  
```bash
./restart.sh
```

---

**Note:**  
Actual scripts may vary depending on your repo. You can view and edit them in the project root or backend folder. Each script should be made executable with `chmod +x scriptname.sh`.

If you have specific `.sh` files in your repo, let me know their names or contents for more tailored documentation!
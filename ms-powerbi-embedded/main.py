import multiprocessing

workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'uvicorn.workers.UvicornWorker'
keepalive = 30
timeout = 60
accesslog = '-'
errorlog = '-'
loglevel = 'info'
graceful_timeout = 120
bind = '0.0.0.0:8000'
max_requests = 1000
max_requests_jitter = 100

# How to Use `cert.sh`

The `cert.sh` script is used to place the required SSL certificate (`ca.pem`) inside your Docker container. This certificate is necessary for the container to securely connect to internal package repositories and fetch Python packages during build or runtime. This is especially important in enterprise environments, where a custom root CA is required for trusted connections.

---

## Usage

```bash
./cert.sh
```

This script will typically:
- Check for the presence of the `ca.pem` certificate file.
- Copy or mount the certificate into your Docker container.
- Ensure Python and other package managers inside the container can securely fetch packages.

---

## Locating `ca.pem`

**Important:**  
The `ca.pem` file for certificate location may vary.

- **Common Locations:**
  - `~/.certs/ca.pem`
  - `~/.zprofile` (may contain the path as an environment variable)
  - `/etc/ssl/certs/ca.pem`
  - Custom locations set by your IT department

**Mac Users:**  
Check your `~/.zprofile` for an environment variable or path pointing to your certificate.  
For example, you can run:
```bash
cat ~/.zprofile | grep ca
```
Or check the default:
```bash
ls ~/.certs/ca.pem
```

**Note:**  
If you cannot find the certificate, contact your IT support or refer to internal documentation.

---

## Example Workflow

1. **Locate your certificate:**

2. **Run the script:**
    ```bash
    ./cert.sh
    ```

3. **Verify installation:**  
   The script may output confirmation or errors if the certificate is missing.

---

## Troubleshooting

- If you see errors about missing certificates, double-check the path and permissions.
- You may need to update your Dockerfile or service configs to reference the correct certificate location.

---

## Summary

- `cert.sh` helps place the required root CA inside your Docker container for secure package installation.
- The `ca.pem` file is required and should be present on your machine.
- For Mac users, check `~/.zprofile` or `~/.certs`.
- Adjust the script or environment variables if your certificate is in a custom location.

If you need further help, contact your IT department or project administrator.
import fs from 'fs';
import { execSync } from 'child_process';

export function generateCerts() {
    const keyPath = './key.pem';
    const certPath = './cert.pem';

    // pour eviter la regeneration systematique du cert
    if (fs.existsSync(keyPath) && fs.existsSync(certPath))
        return
    else if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath);
    else if (fs.existsSync(certPath)) fs.unlinkSync(certPath);

    execSync(
        `openssl req -x509 -newkey rsa:4096 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/CN=localhost"`,
        { stdio: 'ignore' } // silence the cert gen in the terminal
    );
    //console.log('Certificates generated'); // test
}

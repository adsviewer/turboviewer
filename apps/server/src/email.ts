import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logger } from '@repo/logger';
import { AWS_REGION, DOMAIN, Environment, MODE } from './config';

// Import the SignupEmailData interface from the appropriate module

const client = new SESClient({ region: AWS_REGION });

const baseDomain = () => `${MODE === Environment.Production ? '' : `${MODE}.`}${DOMAIN}`;
const baseUrl = () => `https://app.${baseDomain()}`;

interface ForgotPasswordEmailData {
  email: string;
  firstName: string;
  lastName: string;
  action_url: string;
  operating_system: string;
  browser_name: string;
}

export const sendForgetPasswordEmail = async (data: ForgotPasswordEmailData) => {
  const command = await client
    .send(
      new SendEmailCommand({
        Destination: {
          ToAddresses: [data.email],
        },
        Source: `hello@${baseDomain()}`,
        Message: {
          Subject: {
            Data: 'Action required to reset your password',
          },
          Body: {
            Html: {
              Data: `<p>${[
                `Hi ${data.firstName} ${data.lastName},`,
                'Someone has requested a link to change your password. You can do this through the button below.',
                `<a href="${data.action_url}">Change my password</a>`,
                '',
                "If you didn't request this, please ignore this email.",
                "Your password won't change until you access the link above and create a new one.",
              ].join('<br />')}</p>`,
            },
          },
        },
      }),
    )
    .catch((err: unknown) => {
      logger.error(err);
    });
  logger.info(JSON.stringify(command));
};

interface SignupEmailData {
  firstName: string;
  email: string;
}

export const sendSignupEmail = async (data: SignupEmailData) => {
  const command = await client
    .send(
      new SendEmailCommand({
        Destination: {
          ToAddresses: [data.email],
        },
        Source: `Team Adsviewer <hello@${baseDomain()}>`,
        Message: {
          Subject: {
            Data: 'Welcome to Adsviewer',
          },
          Body: {
            Html: {
              Data: createSignupEmailBody(data),
            },
          },
        },
      }),
    )
    .catch((err: unknown) => {
      logger.error(err);
    });
  logger.info(JSON.stringify(command));
};

const createSignupEmailBody = (data: SignupEmailData) => {
  const settingsUrl = new URL('/settings', baseUrl()).toString();
  const addInventoryUrl = new URL('/add-items', baseUrl()).toString();
  const viewInventoryUrl = new URL('/inventory', baseUrl()).toString();

  const body = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>Welcome to Adsviewer</title>
        <style>
            body { font-family: Arial, sans-serif; }
            .container { width: 80%; margin: auto; padding: 20px; }
            .header { background-color: #0060F1; color: white; padding: 10px; text-align: center; }
            .content { margin-top: 20px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; }
            .button {
                background-color: #0060F1; /* Blue */
                border: none;
                color: white !important; /* Ensures text is white */
                padding: 10px 20px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 16px;
                margin: 4px 2px;
                cursor: pointer;
                border-radius: 4px; /* Optional: for rounded corners */
            }
            .button:hover, .button:active, .button:focus {
                text-decoration: none !important;
                color: white !important;
            }
            a { 
                text-decoration: underline !important; /* Ensures that links are underlined */
            }
            .icon-text {
                display: inline-block;
                vertical-align: middle;
                margin-right: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Adsviewer</h1>
            </div>
            <div class="content">
                <p>Hi ${data.firstName},</p>

                <p>We're thrilled to have you join us at Adsviewer – your new partner in revolutionizing how you manage your inventory. With Adsviewer, you're on the path to more efficient and automated inventory and sales management, tailored for your business needs.</p>

                <p>You can get started with three easy steps:</p>
                <ol>
                    <li><strong><a href="${settingsUrl}">Connect Your Inventory Sources:</a></strong> Integrate your sales channels to effortlessly sync your current inventory from existing channels to Adsviewer.</li>
                    <li><strong><a href="${addInventoryUrl}">Add New Inventory:</a></strong> Add your first few items using the basic Upload features. This simple step lets you add new items to your inventory in a snap.</li>
                    <li><strong><a href="${viewInventoryUrl}">List Your Products:</a></strong> Now that you're ready to showcase your products, select items and hit the List button to list your inventory across multiple marketplaces and sales channels.</li>
                </ol>

                <p>We're eager to support you every step of the way. Should you have any questions or feedback, reach out anytime at <a href="mailto:support@${baseDomain()}">support@${baseDomain()}</a>, or Book A Call by using the button below.</p>
                
                <p><a href="https://adsviewer.io/contact" class="button">Book A Call</a></p>

                <p>Once again, welcome to the Adsviewer family. Here's to less time managing inventory and more time growing your business! We look forward to onboarding you to Adsviewer.</p>

                <div class="footer">
                    <p>Cheers,<br>
                    The Adsviewer Team<br>
                    <span class="icon-text">✉️</span><a href="mailto:hello@${baseDomain()}">hello@${baseDomain()}</a></p>
                </div>
            </div>
        </div>
    </body>
    </html>`;

  return body;
};

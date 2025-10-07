import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateAccessToken } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    console.log('WordPress registration request received');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { site_url, site_name, admin_email, wordpress_version, bot_id } = body;

    if (!site_url || !site_name) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Site URL and name are required' },
        { status: 400 }
      );
    }

    console.log('Checking for existing site...');
    // Check if site is already registered
    const existingSite = await db.wordPressSite.findUnique({
      where: { site_url }
    });

    let siteId: string;
    let accessToken: string;

    if (existingSite) {
      console.log('Site exists, updating...');
      // Update existing site
      siteId = existingSite.id;
      accessToken = existingSite.access_token;
      
      await db.wordPressSite.update({
        where: { id: siteId },
        data: {
          site_name,
          admin_email,
          wordpress_version,
          last_sync: new Date()
        }
      });
    } else {
      console.log('Creating new site...');
      // Create new site
      accessToken = generateAccessToken();
      console.log('Generated access token:', accessToken);
      
      const newSite = await db.wordPressSite.create({
        data: {
          site_url,
          site_name,
          admin_email,
          wordpress_version,
          access_token: accessToken,
          last_sync: new Date()
        }
      });
      
      siteId = newSite.id;
      console.log('Created site with ID:', siteId);
    }

    console.log('Handling bot assignment...');
    let botId: string;
    
    // If bot_id is provided, use that bot
    if (bot_id) {
      console.log('Using specified bot_id:', bot_id);
      
      // Verify the bot exists
      const specifiedBot = await db.bot.findUnique({
        where: { id: parseInt(bot_id) }
      });
      
      if (!specifiedBot) {
        console.log('Specified bot not found:', bot_id);
        return NextResponse.json(
          { error: 'Specified bot not found' },
          { status: 400 }
        );
      }
      
      // Update the bot to link it to this WordPress site
      await db.bot.update({
        where: { id: parseInt(bot_id) },
        data: { wordpress_site_id: siteId }
      });
      
      botId = bot_id;
      console.log('Linked bot', botId, 'to site', siteId);
    } else {
      // Create or get bot for this site (original logic)
      const existingBot = await db.bot.findFirst({
        where: { wordpress_site_id: siteId }
      });

      if (existingBot) {
        botId = existingBot.id.toString();
        console.log('Using existing bot:', botId);
      } else {
        // First, get or create a system user
        let systemUser = await db.user.findFirst({
          where: { email: 'system@omnix.ai' }
        });

        if (!systemUser) {
          systemUser = await db.user.create({
            data: {
              email: 'system@omnix.ai',
              password_hash: 'system',
              name: 'System User',
              role: 'admin'
            }
          });
          console.log('Created system user:', systemUser.id);
        }

        const newBot = await db.bot.create({
          data: {
            name: `${site_name} Chatbot`,
            description: `AI chatbot for ${site_name}`,
            wordpress_site_id: siteId,
            user_id: systemUser.id,
            status: 'deployed',
            is_deployed: true
          }
        });
        botId = newBot.id.toString();
        console.log('Created new bot:', botId);
      }
    }

    const response = {
      success: true,
      access_token: accessToken,
      bot_id: botId,
      site_id: siteId,
      message: 'Site registered successfully'
    };

    console.log('Registration successful:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('WordPress registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register site: ' + error.message },
      { status: 500 }
    );
  }
}

import { render, screen } from '@testing-library/react-native';
import { MessageThread } from './MessageThread';

describe('MessageThread', () => {
  it("shows who sent each message and the time in the agent's timezone", async () => {
    await render(
      <MessageThread
        timeZone="Asia/Dubai"
        messages={[
          {
            id: '1',
            leadId: 'lead-1',
            direction: 'inbound',
            channel: 'whatsapp',
            body: 'Hi, any 2-beds in the Marina?',
            sentAt: '2026-10-15T20:30:00.000Z',
          },
        ]}
      />,
    );

    expect(screen.getByText('Hi, any 2-beds in the Marina?')).toBeTruthy();
    // 20:30 UTC is 00:30 the next day in Dubai.
    expect(screen.getByText(/From lead · whatsapp · 16 Oct, 00:30/)).toBeTruthy();
  });

  it('says so when there are no messages', async () => {
    await render(<MessageThread messages={[]} timeZone="Asia/Dubai" />);
    expect(screen.getByText('No messages yet.')).toBeTruthy();
  });
});

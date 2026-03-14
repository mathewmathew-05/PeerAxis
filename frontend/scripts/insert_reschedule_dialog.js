const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../src/pages/SessionDetailsPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// Normalise to LF for matching
const norm = content.replace(/\r\n/g, '\n');

const anchor = `      </Dialog>
    </div>
  );
};

export default SessionDetailsPage;`;

const replacement = `      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              Reschedule Session
            </DialogTitle>
            <DialogDescription>
              Choose a new date and time for this session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>New Date</Label>
              <Input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={rescheduleDate}
                onChange={e => setRescheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>New Time</Label>
              <Input
                type="time"
                value={rescheduleTime}
                onChange={e => setRescheduleTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)} disabled={isRescheduling}>
              Keep Current Time
            </Button>
            <Button onClick={handleReschedule} disabled={isRescheduling}>
              {isRescheduling ? 'Saving...' : 'Save New Time'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionDetailsPage;`;

if (!norm.includes(anchor)) {
  console.error('Anchor not found in file!');
  process.exit(1);
}

const result = norm.replace(anchor, replacement);
// Write back with CRLF
fs.writeFileSync(file, result.replace(/\n/g, '\r\n'), 'utf8');
console.log('Done — reschedule dialog inserted');

import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { config } from './config';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  value = 5;
  sum = signal(0);
  count = signal(0);
  submitted = signal(false);
  loading = signal(false);
  error = signal('');

  private supabase: SupabaseClient;
  private channel: RealtimeChannel | null = null;
  private userId: string;

  constructor() {
    this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
    this.userId = this.getOrCreateUserId();
    this.submitted.set(localStorage.getItem('what2do_submitted') === 'true');
  }

  ngOnInit() {
    this.fetchSum();
    this.channel = this.supabase
      .channel('submissions-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'submissions' },
        () => this.fetchSum()
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.channel?.unsubscribe();
  }

  private getOrCreateUserId(): string {
    const key = 'what2do_user_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  }

  private async fetchSum() {
    const { data, error } = await this.supabase.from('submissions').select('value');
    if (!error && data) {
      this.sum.set(data.reduce((acc, row) => acc + row.value, 0));
      this.count.set(data.length);
    }
  }

  async submit() {
    this.loading.set(true);
    this.error.set('');
    try {
      const res = await fetch(`${config.backendUrl}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: this.userId, value: this.value }),
      });
      if (res.ok) {
        this.submitted.set(true);
        localStorage.setItem('what2do_submitted', 'true');
      } else if (res.status === 409) {
        this.submitted.set(true);
        localStorage.setItem('what2do_submitted', 'true');
      } else {
        this.error.set('Something went wrong. Please try again.');
      }
    } catch {
      this.error.set('Could not reach the server. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}

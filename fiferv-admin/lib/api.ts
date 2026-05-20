import { getSupabaseClient } from './supabase';

function getClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not available');
  }
  return client;
}

// AI Toggle
export async function getAIStatus() {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('channel_config')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error fetching AI status:', error);
    throw error;
  }
}

export async function updateAIStatus(enabled: boolean) {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('channel_config')
      .update({ active: enabled })
      .eq('id', 'ai-status')
      .select();
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating AI status:', error);
    throw error;
  }
}

// Leads
export async function getLeads(limit = 50) {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
}

export async function updateLead(id: string, updates: Record<string, any>) {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating lead:', error);
    throw error;
  }
}

export async function markLeadAsContacted(id: string) {
  return updateLead(id, { contacted: true });
}

// Email Recipients
export async function getEmailRecipients() {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('channel_config')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching email recipients:', error);
    throw error;
  }
}

export async function addEmailRecipient(email: string) {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('channel_config')
      .insert({ recipient_email: email, active: true });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error adding email recipient:', error);
    throw error;
  }
}

export async function removeEmailRecipient(id: string) {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('channel_config')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error removing email recipient:', error);
    throw error;
  }
}

// Schedule
export async function getScheduleConfig() {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('schedule_config')
      .select('*')
      .order('day_of_week', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
}

export async function updateSchedule(id: string, updates: Record<string, any>) {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('schedule_config')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error;
  }
}

// Analytics
export async function getCallAnalytics(days = 30) {
  try {
    const supabase = getClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching call analytics:', error);
    throw error;
  }
}

export async function getLeadAnalytics(days = 30) {
  try {
    const supabase = getClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching lead analytics:', error);
    throw error;
  }
}

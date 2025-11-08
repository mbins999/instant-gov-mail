import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Template {
  id: string;
  name: string;
  category: string;
  type: string;
  greeting: string;
  subject_template: string;
  content_template: string;
  variables: Array<{
    name: string;
    description: string;
    type: string;
  }>;
  entity_id: string | null;
  is_active: boolean;
  is_public: boolean;
  usage_count: number;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export function useTemplates(category?: string, type?: string) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      let query = supabase
        .from('correspondence_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (type && type !== 'all') {
        query = query.or(`type.eq.${type},type.eq.all`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTemplates((data || []) as Template[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [category, type]);

  const applyTemplate = (template: Template, values: Record<string, string>) => {
    let subject = template.subject_template || '';
    let content = template.content_template;

    // استبدال المتغيرات
    Object.entries(values).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    return {
      greeting: template.greeting,
      subject,
      content
    };
  };

  const incrementUsageCount = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      const { error } = await supabase
        .from('correspondence_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', templateId);

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing usage count:', error);
    }
  };

  return {
    templates,
    loading,
    applyTemplate,
    incrementUsageCount,
    refetch: fetchTemplates
  };
}

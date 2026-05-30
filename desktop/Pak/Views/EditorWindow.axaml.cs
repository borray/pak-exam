using System;
using System.Collections.Generic;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Markup.Xaml;
using Avalonia.Media;
using Pak.Models;
using Pak.Services;

namespace Pak.Views;

public partial class EditorWindow : Window
{
    private readonly Exam _exam;

    private static readonly Dictionary<string, string> TypeLabels = new()
    {
        ["single"] = "Один правильный ответ",
        ["multi"] = "Несколько правильных ответов",
        ["open"] = "Открытый ответ",
        ["match"] = "Соответствие",
        ["fillblank"] = "Заполнить пропуск",
    };

    private static readonly string[] Letters = { "А", "Б", "В", "Г", "Д", "Е", "Ж", "З" };

    public EditorWindow() : this(new Exam()) { }

    public EditorWindow(Exam exam)
    {
        _exam = exam;
        InitializeComponent();
        this.FindControl<Button>("SaveBtn")!.Click += (_, _) => Save();
        Rebuild();
    }

    private void InitializeComponent() => AvaloniaXamlLoader.Load(this);

    private static TextBlock Label(string text) => new()
    {
        Text = text, Foreground = Brush.Parse("#888"), FontSize = 11,
        Margin = new Thickness(0, 6, 0, 2),
    };

    private static TextBlock Section(string text) => new()
    {
        Text = text.ToUpper(), Foreground = Brush.Parse("#666"), FontSize = 11,
        FontWeight = FontWeight.Bold, Margin = new Thickness(0, 12, 0, 2),
    };

    private static TextBox Input(string value, Action<string> onChange, string watermark = "")
    {
        var tb = new TextBox
        {
            Text = value, Watermark = watermark,
            Background = Brush.Parse("#222"), Foreground = Brushes.White,
            BorderBrush = Brush.Parse("#444"),
        };
        tb.TextChanged += (_, _) => onChange(tb.Text ?? "");
        return tb;
    }

    private void SetHeaderId() => this.FindControl<TextBlock>("HeaderId")!.Text = _exam.Id;

    private void Rebuild()
    {
        SetHeaderId();
        var root = this.FindControl<StackPanel>("Root")!;
        root.Children.Clear();

        root.Children.Add(Section("Сведения об экзамене"));

        root.Children.Add(Label("Название"));
        root.Children.Add(Input(_exam.Title, v => _exam.Title = v));

        root.Children.Add(Label("Предмет"));
        root.Children.Add(Input(_exam.Subject, v =>
        {
            _exam.Subject = v;
            _exam.SubjectAbbr = Defaults.GetSubjectAbbr(v);
            _exam.Id = Defaults.ExamId(_exam.Year, _exam.SubjectAbbr, _exam.Variant);
            SetHeaderId();
        }));

        root.Children.Add(Label("Учреждение"));
        root.Children.Add(Input(_exam.Institution, v => _exam.Institution = v));

        var g2 = new Grid { ColumnDefinitions = new ColumnDefinitions("*,12,*") };
        var a1 = new StackPanel();
        a1.Children.Add(Label("Код учреждения"));
        a1.Children.Add(Input(_exam.InstitutionCode, v => { _exam.InstitutionCode = v; Storage.LastInstitutionCode = v; }));
        var a2 = new StackPanel();
        a2.Children.Add(Label("Автор / составитель"));
        a2.Children.Add(Input(_exam.Author, v => _exam.Author = v));
        Grid.SetColumn(a1, 0); Grid.SetColumn(a2, 2);
        g2.Children.Add(a1); g2.Children.Add(a2);
        root.Children.Add(g2);

        var g3 = new Grid { ColumnDefinitions = new ColumnDefinitions("*,12,*,12,*") };
        var b1 = new StackPanel();
        b1.Children.Add(Label("Вариант"));
        b1.Children.Add(Input(_exam.Variant.ToString(), v =>
        {
            if (int.TryParse(v, out var n)) { _exam.Variant = n; _exam.Id = Defaults.ExamId(_exam.Year, _exam.SubjectAbbr, n); SetHeaderId(); }
        }));
        var b2 = new StackPanel();
        b2.Children.Add(Label("Лимит (мин)"));
        b2.Children.Add(Input(_exam.TimeLimit?.ToString() ?? "", v => _exam.TimeLimit = int.TryParse(v, out var n) ? n : null, "без лимита"));
        var b3 = new StackPanel();
        b3.Children.Add(Label("Баллов по умолчанию"));
        b3.Children.Add(Input(_exam.DefaultPoints.ToString(), v => { if (double.TryParse(v, out var d)) _exam.DefaultPoints = d; }));
        Grid.SetColumn(b1, 0); Grid.SetColumn(b2, 2); Grid.SetColumn(b3, 4);
        g3.Children.Add(b1); g3.Children.Add(b2); g3.Children.Add(b3);
        root.Children.Add(g3);

        var sq = new CheckBox { Content = "Перемешивать вопросы", IsChecked = _exam.ShuffleQuestions, Foreground = Brush.Parse("#aaa"), Margin = new Thickness(0, 8, 0, 0) };
        sq.IsCheckedChanged += (_, _) => _exam.ShuffleQuestions = sq.IsChecked ?? false;
        var so = new CheckBox { Content = "Перемешивать варианты ответов", IsChecked = _exam.ShuffleOptions, Foreground = Brush.Parse("#aaa") };
        so.IsCheckedChanged += (_, _) => _exam.ShuffleOptions = so.IsChecked ?? false;
        root.Children.Add(sq);
        root.Children.Add(so);

        root.Children.Add(Section($"Вопросы ({_exam.Questions.Count})"));

        var add = new WrapPanel();
        foreach (var kv in TypeLabels)
        {
            var type = kv.Key;
            var btn = new Button
            {
                Content = "+ " + kv.Value,
                Background = Brush.Parse("#222"), Foreground = Brush.Parse("#ccc"),
                BorderBrush = Brush.Parse("#444"), BorderThickness = new Thickness(1),
                Margin = new Thickness(0, 0, 8, 8), Padding = new Thickness(10, 6),
            };
            btn.Click += (_, _) => { _exam.Questions.Add(Defaults.NewQuestion(type, _exam.DefaultPoints)); Rebuild(); };
            add.Children.Add(btn);
        }
        root.Children.Add(add);

        for (int i = 0; i < _exam.Questions.Count; i++)
            root.Children.Add(BuildQuestion(_exam.Questions[i], i));
    }

    private Control BuildQuestion(Question q, int index)
    {
        var card = new Border
        {
            Background = Brush.Parse("#1d1d1d"), BorderBrush = Brush.Parse("#2e2e2e"),
            BorderThickness = new Thickness(1), Padding = new Thickness(12),
            Margin = new Thickness(0, 0, 0, 10),
        };
        var panel = new StackPanel { Spacing = 4 };

        var head = new Grid { ColumnDefinitions = new ColumnDefinitions("*,Auto,Auto,Auto") };
        var num = new TextBlock { Text = $"{index + 1}. {TypeLabels[q.Type]}", Foreground = Brush.Parse("#ddd"), FontWeight = FontWeight.Bold, VerticalAlignment = VerticalAlignment.Center };
        Grid.SetColumn(num, 0);
        var up = IconBtn("↑", "#888", () => { if (index > 0) { (_exam.Questions[index - 1], _exam.Questions[index]) = (_exam.Questions[index], _exam.Questions[index - 1]); Rebuild(); } });
        Grid.SetColumn(up, 1);
        var down = IconBtn("↓", "#888", () => { if (index < _exam.Questions.Count - 1) { (_exam.Questions[index + 1], _exam.Questions[index]) = (_exam.Questions[index], _exam.Questions[index + 1]); Rebuild(); } });
        Grid.SetColumn(down, 2);
        var del = IconBtn("Удалить", "#a55", () => { _exam.Questions.RemoveAt(index); Rebuild(); });
        Grid.SetColumn(del, 3);
        head.Children.Add(num); head.Children.Add(up); head.Children.Add(down); head.Children.Add(del);
        panel.Children.Add(head);

        panel.Children.Add(Input(q.Text, v => q.Text = v, "Текст вопроса..."));

        var pts = new StackPanel { Orientation = Orientation.Horizontal, Spacing = 6 };
        pts.Children.Add(new TextBlock { Text = "Баллы:", Foreground = Brush.Parse("#888"), VerticalAlignment = VerticalAlignment.Center });
        var ptsBox = Input(q.Points.ToString(), v => { if (double.TryParse(v, out var d)) q.Points = d; });
        ptsBox.Width = 90;
        pts.Children.Add(ptsBox);
        panel.Children.Add(pts);

        switch (q.Type)
        {
            case "single":
            case "multi": panel.Children.Add(BuildOptions(q)); break;
            case "open":
                panel.Children.Add(Label("Правильный ответ (для автопроверки)"));
                panel.Children.Add(Input(q.Answer ?? "", v => q.Answer = v, "пусто — ручная проверка"));
                break;
            case "match": panel.Children.Add(BuildPairs(q)); break;
            case "fillblank": panel.Children.Add(BuildFillBlank(q)); break;
        }

        card.Child = panel;
        return card;
    }

    private static Button IconBtn(string text, string fg, Action onClick)
    {
        var b = new Button { Content = text, Background = Brushes.Transparent, Foreground = Brush.Parse(fg), Margin = new Thickness(4, 0, 0, 0), Padding = new Thickness(8, 4) };
        b.Click += (_, _) => onClick();
        return b;
    }

    private Control BuildOptions(Question q)
    {
        var sp = new StackPanel { Spacing = 4, Margin = new Thickness(0, 4, 0, 0) };
        for (int i = 0; i < q.Options.Count; i++)
        {
            var idx = i;
            var row = new Grid { ColumnDefinitions = new ColumnDefinitions("Auto,Auto,*,Auto") };

            Control marker;
            if (q.Type == "single")
            {
                var rb = new RadioButton { GroupName = "q_" + q.Id, IsChecked = q.Correct == idx, Foreground = Brush.Parse("#aaa"), VerticalAlignment = VerticalAlignment.Center };
                rb.IsCheckedChanged += (_, _) => { if (rb.IsChecked == true) q.Correct = idx; };
                marker = rb;
            }
            else
            {
                var cb = new CheckBox { IsChecked = q.CorrectMulti.Contains(idx), Foreground = Brush.Parse("#aaa"), VerticalAlignment = VerticalAlignment.Center };
                cb.IsCheckedChanged += (_, _) =>
                {
                    if (cb.IsChecked == true) { if (!q.CorrectMulti.Contains(idx)) q.CorrectMulti.Add(idx); }
                    else q.CorrectMulti.Remove(idx);
                };
                marker = cb;
            }
            Grid.SetColumn(marker, 0);

            var letter = new TextBlock { Text = Letters[idx] + ")", Foreground = Brush.Parse("#888"), VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(4, 0, 6, 0) };
            Grid.SetColumn(letter, 1);

            var box = Input(q.Options[idx], v => q.Options[idx] = v, "вариант " + Letters[idx]);
            Grid.SetColumn(box, 2);

            var rm = IconBtn("✕", "#a55", () =>
            {
                if (q.Options.Count > 2)
                {
                    q.Options.RemoveAt(idx);
                    if (q.Correct >= q.Options.Count) q.Correct = 0;
                    q.CorrectMulti.Remove(idx);
                    Rebuild();
                }
            });
            Grid.SetColumn(rm, 3);

            row.Children.Add(marker); row.Children.Add(letter); row.Children.Add(box); row.Children.Add(rm);
            sp.Children.Add(row);
        }
        if (q.Options.Count < 8)
        {
            var ab = new Button { Content = "+ вариант", Background = Brush.Parse("#222"), Foreground = Brush.Parse("#aaa"), BorderBrush = Brush.Parse("#444"), BorderThickness = new Thickness(1), Margin = new Thickness(0, 4, 0, 0) };
            ab.Click += (_, _) => { q.Options.Add(""); Rebuild(); };
            sp.Children.Add(ab);
        }
        return sp;
    }

    private Control BuildPairs(Question q)
    {
        var sp = new StackPanel { Spacing = 4, Margin = new Thickness(0, 4, 0, 0) };
        for (int i = 0; i < q.Pairs.Count; i++)
        {
            var idx = i;
            var row = new Grid { ColumnDefinitions = new ColumnDefinitions("Auto,*,Auto,*,Auto") };
            var n = new TextBlock { Text = (idx + 1) + ".", Foreground = Brush.Parse("#888"), VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(0, 0, 6, 0) };
            Grid.SetColumn(n, 0);
            var left = Input(q.Pairs[idx].Left, v => q.Pairs[idx].Left = v, "левый");
            Grid.SetColumn(left, 1);
            var arrow = new TextBlock { Text = " — ", Foreground = Brush.Parse("#888"), VerticalAlignment = VerticalAlignment.Center };
            Grid.SetColumn(arrow, 2);
            var right = Input(q.Pairs[idx].Right, v => q.Pairs[idx].Right = v, "правый");
            Grid.SetColumn(right, 3);
            var rm = IconBtn("✕", "#a55", () => { if (q.Pairs.Count > 2) { q.Pairs.RemoveAt(idx); Rebuild(); } });
            Grid.SetColumn(rm, 4);
            row.Children.Add(n); row.Children.Add(left); row.Children.Add(arrow); row.Children.Add(right); row.Children.Add(rm);
            sp.Children.Add(row);
        }
        var ab = new Button { Content = "+ пара", Background = Brush.Parse("#222"), Foreground = Brush.Parse("#aaa"), BorderBrush = Brush.Parse("#444"), BorderThickness = new Thickness(1), Margin = new Thickness(0, 4, 0, 0) };
        ab.Click += (_, _) => { q.Pairs.Add(new MatchPair()); Rebuild(); };
        sp.Children.Add(ab);
        return sp;
    }

    private Control BuildFillBlank(Question q)
    {
        var sp = new StackPanel { Spacing = 4, Margin = new Thickness(0, 4, 0, 0) };
        sp.Children.Add(Label("Шаблон (___ — пропуск)"));
        sp.Children.Add(Input(q.Template, v =>
        {
            q.Template = v;
            int count = 0, idx = 0;
            while ((idx = v.IndexOf("___", idx, StringComparison.Ordinal)) >= 0) { count++; idx += 3; }
            while (q.Answers.Count < count) q.Answers.Add("");
            while (q.Answers.Count > count && q.Answers.Count > 0) q.Answers.RemoveAt(q.Answers.Count - 1);
        }));
        for (int i = 0; i < q.Answers.Count; i++)
        {
            var idx = i;
            sp.Children.Add(Label($"Ответ {idx + 1}"));
            sp.Children.Add(Input(q.Answers[idx], v => q.Answers[idx] = v));
        }
        return sp;
    }

    private async void Save()
    {
        Storage.SaveExam(_exam);
        var dlg = new Window
        {
            Width = 320, Height = 120, Background = Brush.Parse("#1a1a1a"),
            Title = "Сохранено", WindowStartupLocation = WindowStartupLocation.CenterOwner,
            Content = new TextBlock
            {
                Text = "Экзамен сохранён.", Foreground = Brushes.White,
                Margin = new Thickness(24), VerticalAlignment = VerticalAlignment.Center,
                HorizontalAlignment = HorizontalAlignment.Center,
            },
        };
        await dlg.ShowDialog(this);
    }
}
